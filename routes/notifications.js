const express = require('express');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { pool } = require('../config/database');
const { authenticateToken, requireRole, authenticateCustomer } = require('../middleware/auth');

const router = express.Router();

// Email configuration
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Twilio configuration
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Send email notification
const sendEmailNotification = async (to, subject, message, attachmentPath = null) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: to,
      subject: subject,
      html: message,
      attachments: attachmentPath ? [{ path: attachmentPath }] : []
    };

    await emailTransporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Send SMS notification
const sendSMSNotification = async (to, message) => {
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    return true;
  } catch (error) {
    console.error('SMS sending error:', error);
    return false;
  }
};

// Send WhatsApp notification
const sendWhatsAppNotification = async (to, message, attachmentPath = null) => {
  try {
    const messageData = {
      body: message,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${to}`
    };

    if (attachmentPath) {
      messageData.mediaUrl = [attachmentPath];
    }

    await twilioClient.messages.create(messageData);
    return true;
  } catch (error) {
    console.error('WhatsApp sending error:', error);
    return false;
  }
};

// Get all notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, type = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT n.*, 
             c.company_name, c.contact_person, c.email,
             cc.certificate_number, cc.due_date
      FROM notifications n
      LEFT JOIN customers c ON n.customer_id = c.id
      LEFT JOIN calibration_certificates cc ON n.certificate_id = cc.id
      WHERE 1=1
    `;

    const params = [];

    if (type) {
      query += ` AND n.notification_type = ?`;
      params.push(type);
    }

    if (status === 'sent') {
      query += ` AND n.is_sent = TRUE`;
    } else if (status === 'pending') {
      query += ` AND n.is_sent = FALSE`;
    }

    query += ` ORDER BY n.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [notifications] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE 1=1';
    const countParams = [];

    if (type) {
      countQuery += ` AND notification_type = ?`;
      countParams.push(type);
    }

    if (status === 'sent') {
      countQuery += ` AND is_sent = TRUE`;
    } else if (status === 'pending') {
      countQuery += ` AND is_sent = FALSE`;
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// Send notification manually
router.post('/send', [
  authenticateToken,
  requireRole(['admin', 'staff'])
], async (req, res) => {
  try {
    const { notificationId } = req.body;

    const [notifications] = await pool.execute(
      'SELECT * FROM notifications WHERE id = ? AND is_sent = FALSE',
      [notificationId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({ message: 'Notification not found or already sent' });
    }

    const notification = notifications[0];

    // Get customer details
    const [customers] = await pool.execute(
      'SELECT * FROM customers WHERE id = ?',
      [notification.customer_id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const customer = customers[0];
    let sent = false;

    // Send based on notification type
    switch (notification.sent_via) {
      case 'email':
        sent = await sendEmailNotification(
          customer.email,
          notification.title,
          notification.message
        );
        break;

      case 'sms':
        if (customer.mobile) {
          sent = await sendSMSNotification(
            customer.mobile,
            `${notification.title}: ${notification.message}`
          );
        }
        break;

      case 'whatsapp':
        if (customer.mobile) {
          sent = await sendWhatsAppNotification(
            customer.mobile,
            `${notification.title}: ${notification.message}`
          );
        }
        break;

      case 'push':
        // TODO: Implement push notification
        sent = true; // Placeholder
        break;
    }

    if (sent) {
      await pool.execute(
        'UPDATE notifications SET is_sent = TRUE, sent_at = NOW() WHERE id = ?',
        [notificationId]
      );

      res.json({ message: 'Notification sent successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send notification' });
    }
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Server error sending notification' });
  }
});

// Create renewal reminder notifications
router.post('/create-renewal-reminders', [
  authenticateToken,
  requireRole(['admin', 'staff'])
], async (req, res) => {
  try {
    const { daysBefore = 7 } = req.body;

    // Find certificates expiring in specified days
    const [certificates] = await pool.execute(`
      SELECT cc.*, c.company_name, c.contact_person, c.email, c.mobile,
             ci.instrument_name, ci.model_number, ci.serial_number
      FROM calibration_certificates cc
      JOIN customers c ON cc.customer_id = c.id
      JOIN customer_instruments ci ON cc.instrument_id = ci.id
      WHERE cc.due_date = DATE_ADD(CURDATE(), INTERVAL ? DAY)
        AND cc.status = 'active'
    `, [daysBefore]);

    let createdCount = 0;

    for (const certificate of certificates) {
      // Check if notification already exists
      const [existingNotifications] = await pool.execute(
        'SELECT id FROM notifications WHERE certificate_id = ? AND notification_type = "renewal_reminder"',
        [certificate.id]
      );

      if (existingNotifications.length === 0) {
        const title = `Calibration Certificate Renewal Reminder - ${certificate.certificate_number}`;
        const message = `
          <h2>Certificate Renewal Reminder</h2>
          <p>Dear ${certificate.contact_person},</p>
          <p>This is a reminder that your calibration certificate for the following instrument is due for renewal:</p>
          <ul>
            <li><strong>Certificate Number:</strong> ${certificate.certificate_number}</li>
            <li><strong>Instrument:</strong> ${certificate.instrument_name}</li>
            <li><strong>Model:</strong> ${certificate.model_number || 'N/A'}</li>
            <li><strong>Serial:</strong> ${certificate.serial_number || 'N/A'}</li>
            <li><strong>Due Date:</strong> ${certificate.due_date}</li>
          </ul>
          <p>Please contact us to schedule your next calibration.</p>
          <p>Best regards,<br>JUST INSTRUMENTS Inc.</p>
        `;

        // Create email notification
        await pool.execute(
          `INSERT INTO notifications (customer_id, certificate_id, notification_type, title, message, sent_via)
           VALUES (?, ?, 'renewal_reminder', ?, ?, 'email')`,
          [certificate.customer_id, certificate.id, title, message]
        );

        // Create SMS notification if mobile number exists
        if (certificate.mobile) {
          const smsMessage = `Certificate ${certificate.certificate_number} for ${certificate.instrument_name} expires on ${certificate.due_date}. Please contact us for renewal.`;
          await pool.execute(
            `INSERT INTO notifications (customer_id, certificate_id, notification_type, title, message, sent_via)
             VALUES (?, ?, 'renewal_reminder', 'Certificate Renewal Reminder', ?, 'sms')`,
            [certificate.customer_id, certificate.id, smsMessage]
          );
        }

        createdCount++;
      }
    }

    res.json({
      message: `Created ${createdCount} renewal reminder notifications`,
      count: createdCount
    });
  } catch (error) {
    console.error('Create renewal reminders error:', error);
    res.status(500).json({ message: 'Server error creating renewal reminders' });
  }
});

// Create expiry alert notifications
router.post('/create-expiry-alerts', [
  authenticateToken,
  requireRole(['admin', 'staff'])
], async (req, res) => {
  try {
    // Find certificates that expired today
    const [certificates] = await pool.execute(`
      SELECT cc.*, c.company_name, c.contact_person, c.email, c.mobile,
             ci.instrument_name, ci.model_number, ci.serial_number
      FROM calibration_certificates cc
      JOIN customers c ON cc.customer_id = c.id
      JOIN customer_instruments ci ON cc.instrument_id = ci.id
      WHERE cc.due_date = CURDATE()
        AND cc.status = 'active'
    `);

    let createdCount = 0;

    for (const certificate of certificates) {
      // Check if notification already exists
      const [existingNotifications] = await pool.execute(
        'SELECT id FROM notifications WHERE certificate_id = ? AND notification_type = "expiry_alert"',
        [certificate.id]
      );

      if (existingNotifications.length === 0) {
        const title = `Calibration Certificate Expired - ${certificate.certificate_number}`;
        const message = `
          <h2>Certificate Expired</h2>
          <p>Dear ${certificate.contact_person},</p>
          <p>Your calibration certificate has expired:</p>
          <ul>
            <li><strong>Certificate Number:</strong> ${certificate.certificate_number}</li>
            <li><strong>Instrument:</strong> ${certificate.instrument_name}</li>
            <li><strong>Model:</strong> ${certificate.model_number || 'N/A'}</li>
            <li><strong>Serial:</strong> ${certificate.serial_number || 'N/A'}</li>
            <li><strong>Expired Date:</strong> ${certificate.due_date}</li>
          </ul>
          <p>Please contact us immediately to schedule calibration to avoid any compliance issues.</p>
          <p>Best regards,<br>JUST INSTRUMENTS Inc.</p>
        `;

        // Create email notification
        await pool.execute(
          `INSERT INTO notifications (customer_id, certificate_id, notification_type, title, message, sent_via)
           VALUES (?, ?, 'expiry_alert', ?, ?, 'email')`,
          [certificate.customer_id, certificate.id, title, message]
        );

        // Create SMS notification if mobile number exists
        if (certificate.mobile) {
          const smsMessage = `URGENT: Certificate ${certificate.certificate_number} for ${certificate.instrument_name} has expired on ${certificate.due_date}. Please contact us immediately.`;
          await pool.execute(
            `INSERT INTO notifications (customer_id, certificate_id, notification_type, title, message, sent_via)
             VALUES (?, ?, 'expiry_alert', 'Certificate Expired', ?, 'sms')`,
            [certificate.customer_id, certificate.id, smsMessage]
          );
        }

        createdCount++;
      }
    }

    res.json({
      message: `Created ${createdCount} expiry alert notifications`,
      count: createdCount
    });
  } catch (error) {
    console.error('Create expiry alerts error:', error);
    res.status(500).json({ message: 'Server error creating expiry alerts' });
  }
});

// Get customer notifications (for mobile app)
router.get('/customer/my-notifications', authenticateCustomer, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [notifications] = await pool.execute(`
      SELECT n.*, cc.certificate_number, cc.due_date, ci.instrument_name
      FROM notifications n
      LEFT JOIN calibration_certificates cc ON n.certificate_id = cc.id
      LEFT JOIN customer_instruments ci ON cc.instrument_id = ci.id
      WHERE n.customer_id = ?
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.customer.id, parseInt(limit), offset]);

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM notifications WHERE customer_id = ?',
      [req.customer.id]
    );
    const total = countResult[0].total;

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customer notifications error:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// Send all pending notifications (cron job endpoint)
router.post('/send-pending', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const [pendingNotifications] = await pool.execute(
      'SELECT * FROM notifications WHERE is_sent = FALSE ORDER BY created_at ASC LIMIT 50',
      []
    );

    let sentCount = 0;
    let failedCount = 0;

    for (const notification of pendingNotifications) {
      // Get customer details
      const [customers] = await pool.execute(
        'SELECT * FROM customers WHERE id = ?',
        [notification.customer_id]
      );

      if (customers.length === 0) {
        failedCount++;
        continue;
      }

      const customer = customers[0];
      let sent = false;

      // Send based on notification type
      switch (notification.sent_via) {
        case 'email':
          sent = await sendEmailNotification(
            customer.email,
            notification.title,
            notification.message
          );
          break;

        case 'sms':
          if (customer.mobile) {
            sent = await sendSMSNotification(
              customer.mobile,
              `${notification.title}: ${notification.message}`
            );
          }
          break;

        case 'whatsapp':
          if (customer.mobile) {
            sent = await sendWhatsAppNotification(
              customer.mobile,
              `${notification.title}: ${notification.message}`
            );
          }
          break;

        case 'push':
          // TODO: Implement push notification
          sent = true; // Placeholder
          break;
      }

      if (sent) {
        await pool.execute(
          'UPDATE notifications SET is_sent = TRUE, sent_at = NOW() WHERE id = ?',
          [notification.id]
        );
        sentCount++;
      } else {
        failedCount++;
      }
    }

    res.json({
      message: `Processed ${pendingNotifications.length} notifications`,
      sent: sentCount,
      failed: failedCount
    });
  } catch (error) {
    console.error('Send pending notifications error:', error);
    res.status(500).json({ message: 'Server error sending pending notifications' });
  }
});

module.exports = router;
