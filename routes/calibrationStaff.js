const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for signature uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/signatures/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'signature-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for signatures'));
    }
  }
});

// Get all calibration staff
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT cs.*,
             COUNT(cc.id) as certificates_prepared
      FROM calibration_staff cs
      LEFT JOIN calibration_certificates cc ON cs.id = cc.signature_id
      WHERE cs.is_active = TRUE
    `;

    const params = [];

    if (search) {
      query += ` AND (cs.staff_name LIKE ? OR cs.designation LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY cs.id ORDER BY cs.staff_name LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [staff] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM calibration_staff WHERE is_active = TRUE';
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (staff_name LIKE ? OR designation LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      staff,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get calibration staff error:', error);
    res.status(500).json({ message: 'Server error fetching calibration staff' });
  }
});

// Get calibration staff by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [staff] = await pool.execute(
      'SELECT * FROM calibration_staff WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (staff.length === 0) {
      return res.status(404).json({ message: 'Calibration staff not found' });
    }

    // Get certificates prepared by this staff member
    const [certificates] = await pool.execute(
      `SELECT cc.*, c.company_name, ci.instrument_name
       FROM calibration_certificates cc
       JOIN customers c ON cc.customer_id = c.id
       JOIN customer_instruments ci ON cc.instrument_id = ci.id
       WHERE cc.signature_id = ?
       ORDER BY cc.created_at DESC
       LIMIT 20`,
      [id]
    );

    res.json({
      staff: staff[0],
      certificates
    });
  } catch (error) {
    console.error('Get calibration staff error:', error);
    res.status(500).json({ message: 'Server error fetching calibration staff' });
  }
});

// Create new calibration staff
router.post('/', [
  authenticateToken,
  requireRole(['admin', 'staff']),
  body('staffName').notEmpty().trim(),
  body('designation').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { staffName, designation } = req.body;

    // Create calibration staff
    const [result] = await pool.execute(
      `INSERT INTO calibration_staff (staff_name, designation)
       VALUES (?, ?)`,
      [staffName, designation]
    );

    res.status(201).json({
      message: 'Calibration staff created successfully',
      staffId: result.insertId
    });
  } catch (error) {
    console.error('Create calibration staff error:', error);
    res.status(500).json({ message: 'Server error creating calibration staff' });
  }
});

// Update calibration staff
router.put('/:id', [
  authenticateToken,
  requireRole(['admin', 'staff']),
  body('staffName').optional().notEmpty().trim(),
  body('designation').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { staffName, designation } = req.body;

    // Check if staff exists
    const [staff] = await pool.execute(
      'SELECT id FROM calibration_staff WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (staff.length === 0) {
      return res.status(404).json({ message: 'Calibration staff not found' });
    }

    // Update calibration staff
    const updateFields = [];
    const updateValues = [];

    if (staffName) {
      updateFields.push('staff_name = ?');
      updateValues.push(staffName);
    }
    if (designation !== undefined) {
      updateFields.push('designation = ?');
      updateValues.push(designation);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE calibration_staff SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Calibration staff updated successfully' });
  } catch (error) {
    console.error('Update calibration staff error:', error);
    res.status(500).json({ message: 'Server error updating calibration staff' });
  }
});

// Upload signature for calibration staff
router.post('/:id/signature', [
  authenticateToken,
  requireRole(['admin', 'staff']),
  upload.single('signature')
], async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No signature file uploaded' });
    }

    // Check if staff exists
    const [staff] = await pool.execute(
      'SELECT id FROM calibration_staff WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (staff.length === 0) {
      return res.status(404).json({ message: 'Calibration staff not found' });
    }

    // Update signature path
    const signaturePath = `/uploads/signatures/${req.file.filename}`;
    await pool.execute(
      'UPDATE calibration_staff SET signature_image = ? WHERE id = ?',
      [signaturePath, id]
    );

    res.json({
      message: 'Signature uploaded successfully',
      signaturePath
    });
  } catch (error) {
    console.error('Upload signature error:', error);
    res.status(500).json({ message: 'Server error uploading signature' });
  }
});

// Delete calibration staff (soft delete)
router.delete('/:id', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if staff exists
    const [staff] = await pool.execute(
      'SELECT id FROM calibration_staff WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (staff.length === 0) {
      return res.status(404).json({ message: 'Calibration staff not found' });
    }

    // Check if staff is being used in active certificates
    const [certificates] = await pool.execute(
      'SELECT id FROM calibration_certificates WHERE signature_id = ? AND status = "active"',
      [id]
    );

    if (certificates.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete calibration staff that is being used in active certificates.' 
      });
    }

    // Soft delete staff
    await pool.execute(
      'UPDATE calibration_staff SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({ message: 'Calibration staff deleted successfully' });
  } catch (error) {
    console.error('Delete calibration staff error:', error);
    res.status(500).json({ message: 'Server error deleting calibration staff' });
  }
});

// Get calibration staff for certificate creation (dropdown)
router.get('/for-certificate', authenticateToken, async (req, res) => {
  try {
    // Get active calibration staff
    const [staff] = await pool.execute(
      `SELECT id, staff_name, designation, signature_image
       FROM calibration_staff 
       WHERE is_active = TRUE 
       ORDER BY staff_name`,
      []
    );

    res.json({ staff });
  } catch (error) {
    console.error('Get calibration staff for certificate error:', error);
    res.status(500).json({ message: 'Server error fetching calibration staff' });
  }
});

module.exports = router;
