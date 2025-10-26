const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all instruments for a customer
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    // Verify customer exists
    const [customers] = await pool.execute(
      'SELECT id FROM customers WHERE id = ? AND is_active = TRUE',
      [customerId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    let query = `
      SELECT ci.*, 
             COUNT(cc.id) as certificate_count,
             MAX(cc.due_date) as last_calibration_due
      FROM customer_instruments ci
      LEFT JOIN calibration_certificates cc ON ci.id = cc.instrument_id
      WHERE ci.customer_id = ? AND ci.is_active = TRUE
    `;

    const params = [customerId];

    if (search) {
      query += ` AND (ci.instrument_name LIKE ? OR ci.model_number LIKE ? OR ci.serial_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY ci.id ORDER BY ci.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [instruments] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM customer_instruments WHERE customer_id = ? AND is_active = TRUE';
    const countParams = [customerId];
    
    if (search) {
      countQuery += ` AND (instrument_name LIKE ? OR model_number LIKE ? OR serial_number LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      instruments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get instruments error:', error);
    res.status(500).json({ message: 'Server error fetching instruments' });
  }
});

// Get instrument by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [instruments] = await pool.execute(
      'SELECT * FROM customer_instruments WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (instruments.length === 0) {
      return res.status(404).json({ message: 'Instrument not found' });
    }

    const instrument = instruments[0];

    // Get certificates for this instrument
    const [certificates] = await pool.execute(
      `SELECT cc.*, u.first_name, u.last_name, cs.staff_name
       FROM calibration_certificates cc
       JOIN users u ON cc.prepared_by = u.id
       JOIN calibration_staff cs ON cc.signature_id = cs.id
       WHERE cc.instrument_id = ?
       ORDER BY cc.created_at DESC`,
      [id]
    );

    res.json({
      instrument,
      certificates
    });
  } catch (error) {
    console.error('Get instrument error:', error);
    res.status(500).json({ message: 'Server error fetching instrument' });
  }
});

// Create new instrument
router.post('/', [
  authenticateToken,
  requireRole(['admin', 'staff']),
  body('customerId').isInt(),
  body('instrumentName').notEmpty().trim(),
  body('modelNumber').optional().trim(),
  body('serialNumber').optional().trim(),
  body('manufacturer').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      customerId,
      instrumentName,
      modelNumber,
      serialNumber,
      manufacturer,
      specifications,
      purchaseDate,
      warrantyExpiry
    } = req.body;

    // Verify customer exists
    const [customers] = await pool.execute(
      'SELECT id FROM customers WHERE id = ? AND is_active = TRUE',
      [customerId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check for duplicate serial number if provided
    if (serialNumber) {
      const [existingInstruments] = await pool.execute(
        'SELECT id FROM customer_instruments WHERE serial_number = ? AND is_active = TRUE',
        [serialNumber]
      );

      if (existingInstruments.length > 0) {
        return res.status(400).json({ message: 'Instrument with this serial number already exists' });
      }
    }

    // Create instrument
    const [result] = await pool.execute(
      `INSERT INTO customer_instruments (customer_id, instrument_name, model_number, serial_number, manufacturer, specifications, purchase_date, warranty_expiry)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [customerId, instrumentName, modelNumber, serialNumber, manufacturer, specifications, purchaseDate, warrantyExpiry]
    );

    res.status(201).json({
      message: 'Instrument created successfully',
      instrumentId: result.insertId
    });
  } catch (error) {
    console.error('Create instrument error:', error);
    res.status(500).json({ message: 'Server error creating instrument' });
  }
});

// Update instrument
router.put('/:id', [
  authenticateToken,
  requireRole(['admin', 'staff']),
  body('instrumentName').optional().notEmpty().trim(),
  body('modelNumber').optional().trim(),
  body('serialNumber').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      instrumentName,
      modelNumber,
      serialNumber,
      manufacturer,
      specifications,
      purchaseDate,
      warrantyExpiry
    } = req.body;

    // Check if instrument exists
    const [instruments] = await pool.execute(
      'SELECT id FROM customer_instruments WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (instruments.length === 0) {
      return res.status(404).json({ message: 'Instrument not found' });
    }

    // Check for duplicate serial number if being updated
    if (serialNumber) {
      const [existingInstruments] = await pool.execute(
        'SELECT id FROM customer_instruments WHERE serial_number = ? AND id != ? AND is_active = TRUE',
        [serialNumber, id]
      );

      if (existingInstruments.length > 0) {
        return res.status(400).json({ message: 'Instrument with this serial number already exists' });
      }
    }

    // Update instrument
    const updateFields = [];
    const updateValues = [];

    if (instrumentName) {
      updateFields.push('instrument_name = ?');
      updateValues.push(instrumentName);
    }
    if (modelNumber !== undefined) {
      updateFields.push('model_number = ?');
      updateValues.push(modelNumber);
    }
    if (serialNumber !== undefined) {
      updateFields.push('serial_number = ?');
      updateValues.push(serialNumber);
    }
    if (manufacturer !== undefined) {
      updateFields.push('manufacturer = ?');
      updateValues.push(manufacturer);
    }
    if (specifications !== undefined) {
      updateFields.push('specifications = ?');
      updateValues.push(specifications);
    }
    if (purchaseDate !== undefined) {
      updateFields.push('purchase_date = ?');
      updateValues.push(purchaseDate);
    }
    if (warrantyExpiry !== undefined) {
      updateFields.push('warranty_expiry = ?');
      updateValues.push(warrantyExpiry);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE customer_instruments SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Instrument updated successfully' });
  } catch (error) {
    console.error('Update instrument error:', error);
    res.status(500).json({ message: 'Server error updating instrument' });
  }
});

// Delete instrument (soft delete)
router.delete('/:id', [
  authenticateToken,
  requireRole(['admin', 'staff'])
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if instrument exists
    const [instruments] = await pool.execute(
      'SELECT id FROM customer_instruments WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (instruments.length === 0) {
      return res.status(404).json({ message: 'Instrument not found' });
    }

    // Check if instrument has active certificates
    const [certificates] = await pool.execute(
      'SELECT id FROM calibration_certificates WHERE instrument_id = ? AND status = "active"',
      [id]
    );

    if (certificates.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete instrument with active certificates. Please renew or expire certificates first.' 
      });
    }

    // Soft delete instrument
    await pool.execute(
      'UPDATE customer_instruments SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({ message: 'Instrument deleted successfully' });
  } catch (error) {
    console.error('Delete instrument error:', error);
    res.status(500).json({ message: 'Server error deleting instrument' });
  }
});

// Get instruments for certificate creation (dropdown)
router.get('/customer/:customerId/for-certificate', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;

    // Verify customer exists
    const [customers] = await pool.execute(
      'SELECT id FROM customers WHERE id = ? AND is_active = TRUE',
      [customerId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get active instruments
    const [instruments] = await pool.execute(
      `SELECT id, instrument_name, model_number, serial_number, manufacturer
       FROM customer_instruments 
       WHERE customer_id = ? AND is_active = TRUE 
       ORDER BY instrument_name`,
      [customerId]
    );

    res.json({ instruments });
  } catch (error) {
    console.error('Get instruments for certificate error:', error);
    res.status(500).json({ message: 'Server error fetching instruments' });
  }
});

module.exports = router;
