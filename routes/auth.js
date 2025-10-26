const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Admin/Staff login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Customer OTP login (for mobile app)
router.post('/customer-otp', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find customer
    const [customers] = await pool.execute(
      'SELECT * FROM customers WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const customer = customers[0];

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save or update mobile user record
    await pool.execute(
      `INSERT INTO mobile_users (customer_id, email, otp, otp_expires_at) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       otp = VALUES(otp), 
       otp_expires_at = VALUES(otp_expires_at)`,
      [customer.id, email, otp, otpExpires]
    );

    // TODO: Send OTP via SMS/WhatsApp
    // For now, we'll return it in response (remove in production)
    res.json({
      message: 'OTP sent successfully',
      otp: otp // Remove this in production
    });
  } catch (error) {
    console.error('OTP generation error:', error);
    res.status(500).json({ message: 'Server error during OTP generation' });
  }
});

// Verify OTP
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp, deviceToken, platform } = req.body;

    // Verify OTP
    const [mobileUsers] = await pool.execute(
      `SELECT mu.*, c.* FROM mobile_users mu 
       JOIN customers c ON mu.customer_id = c.id 
       WHERE mu.email = ? AND mu.otp = ? AND mu.otp_expires_at > NOW()`,
      [email, otp]
    );

    if (mobileUsers.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const mobileUser = mobileUsers[0];

    // Update mobile user with device info
    await pool.execute(
      'UPDATE mobile_users SET is_verified = TRUE, device_token = ?, platform = ? WHERE id = ?',
      [deviceToken, platform, mobileUser.id]
    );

    // Generate JWT token for customer
    const token = jwt.sign(
      { customerId: mobileUser.customer_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: 'OTP verified successfully',
      token,
      customer: {
        id: mobileUser.customer_id,
        companyName: mobileUser.company_name,
        email: mobileUser.email,
        contactPerson: mobileUser.contact_person
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Change password
router.put('/change-password', [
  authenticateToken,
  body('currentPassword').isLength({ min: 6 }),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current user with password
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

module.exports = router;
