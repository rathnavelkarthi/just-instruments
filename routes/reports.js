const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Dashboard overview
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Get total counts
    const [totalCustomers] = await pool.execute(
      'SELECT COUNT(*) as count FROM customers WHERE is_active = TRUE'
    );

    const [totalInstruments] = await pool.execute(
      'SELECT COUNT(*) as count FROM customer_instruments WHERE is_active = TRUE'
    );

    const [totalCertificates] = await pool.execute(
      'SELECT COUNT(*) as count FROM calibration_certificates'
    );

    const [activeCertificates] = await pool.execute(
      'SELECT COUNT(*) as count FROM calibration_certificates WHERE status = "active"'
    );

    const [expiredCertificates] = await pool.execute(
      'SELECT COUNT(*) as count FROM calibration_certificates WHERE due_date < CURDATE() AND status = "active"'
    );

    const [expiringSoonCertificates] = await pool.execute(
      'SELECT COUNT(*) as count FROM calibration_certificates WHERE due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND status = "active"'
    );

    // Get recent certificates
    const [recentCertificates] = await pool.execute(`
      SELECT cc.certificate_number, cc.calibration_date, cc.due_date,
             c.company_name, ci.instrument_name
      FROM calibration_certificates cc
      JOIN customers c ON cc.customer_id = c.id
      JOIN customer_instruments ci ON cc.instrument_id = ci.id
      ORDER BY cc.created_at DESC
      LIMIT 10
    `);

    // Get expiring certificates
    const [expiringCertificates] = await pool.execute(`
      SELECT cc.certificate_number, cc.due_date,
             c.company_name, c.contact_person, c.email, c.phone,
             ci.instrument_name, ci.model_number, ci.serial_number,
             DATEDIFF(cc.due_date, CURDATE()) as days_remaining
      FROM calibration_certificates cc
      JOIN customers c ON cc.customer_id = c.id
      JOIN customer_instruments ci ON cc.instrument_id = ci.id
      WHERE cc.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        AND cc.status = 'active'
      ORDER BY cc.due_date ASC
      LIMIT 20
    `);

    // Get monthly certificate statistics
    const [monthlyStats] = await pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as certificates_issued
      FROM calibration_certificates
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    res.json({
      overview: {
        totalCustomers: totalCustomers[0].count,
        totalInstruments: totalInstruments[0].count,
        totalCertificates: totalCertificates[0].count,
        activeCertificates: activeCertificates[0].count,
        expiredCertificates: expiredCertificates[0].count,
        expiringSoonCertificates: expiringSoonCertificates[0].count
      },
      recentCertificates,
      expiringCertificates,
      monthlyStats
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
});

// Certificate statistics
router.get('/certificates', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, customerId } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      whereClause += ' AND cc.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND cc.created_at <= ?';
      params.push(endDate);
    }

    if (customerId) {
      whereClause += ' AND cc.customer_id = ?';
      params.push(customerId);
    }

    // Get certificate statistics
    const [certificateStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_certificates,
        SUM(CASE WHEN cc.status = 'active' THEN 1 ELSE 0 END) as active_certificates,
        SUM(CASE WHEN cc.due_date < CURDATE() AND cc.status = 'active' THEN 1 ELSE 0 END) as expired_certificates,
        SUM(CASE WHEN cc.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND cc.status = 'active' THEN 1 ELSE 0 END) as expiring_soon,
        SUM(CASE WHEN cc.due_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND cc.status = 'active' THEN 1 ELSE 0 END) as valid_certificates
      FROM calibration_certificates cc
      ${whereClause}
    `, params);

    // Get certificates by status
    const [certificatesByStatus] = await pool.execute(`
      SELECT 
        cc.status,
        COUNT(*) as count
      FROM calibration_certificates cc
      ${whereClause}
      GROUP BY cc.status
    `, params);

    // Get certificates by month
    const [certificatesByMonth] = await pool.execute(`
      SELECT 
        DATE_FORMAT(cc.created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM calibration_certificates cc
      ${whereClause}
      GROUP BY DATE_FORMAT(cc.created_at, '%Y-%m')
      ORDER BY month ASC
    `, params);

    // Get top customers by certificate count
    const [topCustomers] = await pool.execute(`
      SELECT 
        c.company_name,
        COUNT(cc.id) as certificate_count
      FROM customers c
      LEFT JOIN calibration_certificates cc ON c.id = cc.customer_id
      ${whereClause.replace('cc.', 'cc.')}
      GROUP BY c.id, c.company_name
      ORDER BY certificate_count DESC
      LIMIT 10
    `, params);

    res.json({
      statistics: certificateStats[0],
      byStatus: certificatesByStatus,
      byMonth: certificatesByMonth,
      topCustomers
    });
  } catch (error) {
    console.error('Certificate statistics error:', error);
    res.status(500).json({ message: 'Server error fetching certificate statistics' });
  }
});

// Customer statistics
router.get('/customers', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      whereClause += ' AND c.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND c.created_at <= ?';
      params.push(endDate);
    }

    // Get customer statistics
    const [customerStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(DISTINCT cc.customer_id) as customers_with_certificates,
        AVG(cert_count.certificate_count) as avg_certificates_per_customer
      FROM customers c
      LEFT JOIN calibration_certificates cc ON c.id = cc.customer_id
      LEFT JOIN (
        SELECT customer_id, COUNT(*) as certificate_count
        FROM calibration_certificates
        GROUP BY customer_id
      ) cert_count ON c.id = cert_count.customer_id
      ${whereClause}
    `, params);

    // Get customers by certificate count
    const [customersByCertificateCount] = await pool.execute(`
      SELECT 
        CASE 
          WHEN cert_count.certificate_count = 0 THEN '0'
          WHEN cert_count.certificate_count BETWEEN 1 AND 5 THEN '1-5'
          WHEN cert_count.certificate_count BETWEEN 6 AND 10 THEN '6-10'
          WHEN cert_count.certificate_count BETWEEN 11 AND 20 THEN '11-20'
          ELSE '20+'
        END as certificate_range,
        COUNT(*) as customer_count
      FROM customers c
      LEFT JOIN (
        SELECT customer_id, COUNT(*) as certificate_count
        FROM calibration_certificates
        GROUP BY customer_id
      ) cert_count ON c.id = cert_count.customer_id
      ${whereClause}
      GROUP BY certificate_range
      ORDER BY certificate_range
    `, params);

    // Get new customers by month
    const [newCustomersByMonth] = await pool.execute(`
      SELECT 
        DATE_FORMAT(c.created_at, '%Y-%m') as month,
        COUNT(*) as new_customers
      FROM customers c
      ${whereClause}
      GROUP BY DATE_FORMAT(c.created_at, '%Y-%m')
      ORDER BY month ASC
    `, params);

    res.json({
      statistics: customerStats[0],
      byCertificateCount: customersByCertificateCount,
      newCustomersByMonth
    });
  } catch (error) {
    console.error('Customer statistics error:', error);
    res.status(500).json({ message: 'Server error fetching customer statistics' });
  }
});

// Renewal statistics
router.get('/renewals', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      whereClause += ' AND cc.due_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND cc.due_date <= ?';
      params.push(endDate);
    }

    // Get renewal statistics
    const [renewalStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_due_for_renewal,
        SUM(CASE WHEN cc.due_date < CURDATE() THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN cc.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as due_in_7_days,
        SUM(CASE WHEN cc.due_date BETWEEN DATE_ADD(CURDATE(), INTERVAL 8 DAY) AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as due_in_30_days
      FROM calibration_certificates cc
      ${whereClause}
      AND cc.status = 'active'
    `, params);

    // Get renewals by month
    const [renewalsByMonth] = await pool.execute(`
      SELECT 
        DATE_FORMAT(cc.due_date, '%Y-%m') as month,
        COUNT(*) as certificates_due
      FROM calibration_certificates cc
      ${whereClause}
      AND cc.status = 'active'
      GROUP BY DATE_FORMAT(cc.due_date, '%Y-%m')
      ORDER BY month ASC
    `, params);

    // Get upcoming renewals
    const [upcomingRenewals] = await pool.execute(`
      SELECT 
        cc.certificate_number,
        cc.due_date,
        c.company_name,
        c.contact_person,
        c.email,
        c.phone,
        ci.instrument_name,
        ci.model_number,
        ci.serial_number,
        DATEDIFF(cc.due_date, CURDATE()) as days_remaining
      FROM calibration_certificates cc
      JOIN customers c ON cc.customer_id = c.id
      JOIN customer_instruments ci ON cc.instrument_id = ci.id
      ${whereClause}
      AND cc.status = 'active'
      ORDER BY cc.due_date ASC
      LIMIT 50
    `, params);

    res.json({
      statistics: renewalStats[0],
      byMonth: renewalsByMonth,
      upcomingRenewals
    });
  } catch (error) {
    console.error('Renewal statistics error:', error);
    res.status(500).json({ message: 'Server error fetching renewal statistics' });
  }
});

// Export data
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const { type, startDate, endDate, customerId } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      whereClause += ' AND cc.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND cc.created_at <= ?';
      params.push(endDate);
    }

    if (customerId) {
      whereClause += ' AND cc.customer_id = ?';
      params.push(customerId);
    }

    let query = '';
    let filename = '';

    switch (type) {
      case 'certificates':
        query = `
          SELECT 
            cc.certificate_number,
            cc.calibration_date,
            cc.due_date,
            cc.status,
            c.company_name,
            c.contact_person,
            c.email,
            c.phone,
            ci.instrument_name,
            ci.model_number,
            ci.serial_number,
            ci.manufacturer,
            u.first_name as prepared_by_first_name,
            u.last_name as prepared_by_last_name,
            cs.staff_name as signature_staff
          FROM calibration_certificates cc
          JOIN customers c ON cc.customer_id = c.id
          JOIN customer_instruments ci ON cc.instrument_id = ci.id
          JOIN users u ON cc.prepared_by = u.id
          JOIN calibration_staff cs ON cc.signature_id = cs.id
          ${whereClause}
          ORDER BY cc.created_at DESC
        `;
        filename = 'certificates_export.csv';
        break;

      case 'customers':
        query = `
          SELECT 
            c.company_name,
            c.contact_person,
            c.email,
            c.phone,
            c.mobile,
            c.website,
            c.gst_number,
            c.pan_number,
            c.created_at,
            COUNT(cc.id) as certificate_count
          FROM customers c
          LEFT JOIN calibration_certificates cc ON c.id = cc.customer_id
          ${whereClause.replace('cc.', 'c.')}
          GROUP BY c.id
          ORDER BY c.created_at DESC
        `;
        filename = 'customers_export.csv';
        break;

      case 'renewals':
        query = `
          SELECT 
            cc.certificate_number,
            cc.due_date,
            c.company_name,
            c.contact_person,
            c.email,
            c.phone,
            ci.instrument_name,
            ci.model_number,
            ci.serial_number,
            DATEDIFF(cc.due_date, CURDATE()) as days_remaining
          FROM calibration_certificates cc
          JOIN customers c ON cc.customer_id = c.id
          JOIN customer_instruments ci ON cc.instrument_id = ci.id
          ${whereClause}
          AND cc.status = 'active'
          ORDER BY cc.due_date ASC
        `;
        filename = 'renewals_export.csv';
        break;

      default:
        return res.status(400).json({ message: 'Invalid export type' });
    }

    const [data] = await pool.execute(query, params);

    // Convert to CSV format
    if (data.length === 0) {
      return res.status(404).json({ message: 'No data found for export' });
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ message: 'Server error exporting data' });
  }
});

module.exports = router;
