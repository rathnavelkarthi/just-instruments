const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all test equipment
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT te.*,
             CASE 
               WHEN te.next_calibration_date < CURDATE() THEN 'overdue'
               WHEN te.next_calibration_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'due_soon'
               ELSE 'valid'
             END as calibration_status
      FROM test_equipment te
      WHERE te.is_active = TRUE
    `;

    const params = [];

    if (search) {
      query += ` AND (te.equipment_name LIKE ? OR te.model_number LIKE ? OR te.serial_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY te.equipment_name LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [equipment] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM test_equipment WHERE is_active = TRUE';
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (equipment_name LIKE ? OR model_number LIKE ? OR serial_number LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      equipment,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get test equipment error:', error);
    res.status(500).json({ message: 'Server error fetching test equipment' });
  }
});

// Get test equipment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [equipment] = await pool.execute(
      'SELECT * FROM test_equipment WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (equipment.length === 0) {
      return res.status(404).json({ message: 'Test equipment not found' });
    }

    res.json({ equipment: equipment[0] });
  } catch (error) {
    console.error('Get test equipment error:', error);
    res.status(500).json({ message: 'Server error fetching test equipment' });
  }
});

// Create new test equipment
router.post('/', [
  authenticateToken,
  requireRole(['admin', 'staff']),
  body('equipmentName').notEmpty().trim(),
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
      equipmentName,
      modelNumber,
      serialNumber,
      manufacturer,
      calibrationDate,
      nextCalibrationDate,
      certificateNumber,
      accuracy,
      rangeMin,
      rangeMax,
      unit
    } = req.body;

    // Check for duplicate serial number if provided
    if (serialNumber) {
      const [existingEquipment] = await pool.execute(
        'SELECT id FROM test_equipment WHERE serial_number = ? AND is_active = TRUE',
        [serialNumber]
      );

      if (existingEquipment.length > 0) {
        return res.status(400).json({ message: 'Test equipment with this serial number already exists' });
      }
    }

    // Create test equipment
    const [result] = await pool.execute(
      `INSERT INTO test_equipment (equipment_name, model_number, serial_number, manufacturer, calibration_date, next_calibration_date, certificate_number, accuracy, range_min, range_max, unit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [equipmentName, modelNumber, serialNumber, manufacturer, calibrationDate, nextCalibrationDate, certificateNumber, accuracy, rangeMin, rangeMax, unit]
    );

    res.status(201).json({
      message: 'Test equipment created successfully',
      equipmentId: result.insertId
    });
  } catch (error) {
    console.error('Create test equipment error:', error);
    res.status(500).json({ message: 'Server error creating test equipment' });
  }
});

// Update test equipment
router.put('/:id', [
  authenticateToken,
  requireRole(['admin', 'staff']),
  body('equipmentName').optional().notEmpty().trim(),
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
      equipmentName,
      modelNumber,
      serialNumber,
      manufacturer,
      calibrationDate,
      nextCalibrationDate,
      certificateNumber,
      accuracy,
      rangeMin,
      rangeMax,
      unit
    } = req.body;

    // Check if equipment exists
    const [equipment] = await pool.execute(
      'SELECT id FROM test_equipment WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (equipment.length === 0) {
      return res.status(404).json({ message: 'Test equipment not found' });
    }

    // Check for duplicate serial number if being updated
    if (serialNumber) {
      const [existingEquipment] = await pool.execute(
        'SELECT id FROM test_equipment WHERE serial_number = ? AND id != ? AND is_active = TRUE',
        [serialNumber, id]
      );

      if (existingEquipment.length > 0) {
        return res.status(400).json({ message: 'Test equipment with this serial number already exists' });
      }
    }

    // Update test equipment
    const updateFields = [];
    const updateValues = [];

    if (equipmentName) {
      updateFields.push('equipment_name = ?');
      updateValues.push(equipmentName);
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
    if (calibrationDate !== undefined) {
      updateFields.push('calibration_date = ?');
      updateValues.push(calibrationDate);
    }
    if (nextCalibrationDate !== undefined) {
      updateFields.push('next_calibration_date = ?');
      updateValues.push(nextCalibrationDate);
    }
    if (certificateNumber !== undefined) {
      updateFields.push('certificate_number = ?');
      updateValues.push(certificateNumber);
    }
    if (accuracy !== undefined) {
      updateFields.push('accuracy = ?');
      updateValues.push(accuracy);
    }
    if (rangeMin !== undefined) {
      updateFields.push('range_min = ?');
      updateValues.push(rangeMin);
    }
    if (rangeMax !== undefined) {
      updateFields.push('range_max = ?');
      updateValues.push(rangeMax);
    }
    if (unit !== undefined) {
      updateFields.push('unit = ?');
      updateValues.push(unit);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE test_equipment SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Test equipment updated successfully' });
  } catch (error) {
    console.error('Update test equipment error:', error);
    res.status(500).json({ message: 'Server error updating test equipment' });
  }
});

// Delete test equipment (soft delete)
router.delete('/:id', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if equipment exists
    const [equipment] = await pool.execute(
      'SELECT id FROM test_equipment WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (equipment.length === 0) {
      return res.status(404).json({ message: 'Test equipment not found' });
    }

    // Check if equipment is being used in active certificates
    const [certificates] = await pool.execute(
      `SELECT id FROM calibration_certificates 
       WHERE JSON_CONTAINS(test_equipment_ids, JSON_QUOTE(?)) AND status = 'active'`,
      [id]
    );

    if (certificates.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete test equipment that is being used in active certificates.' 
      });
    }

    // Soft delete equipment
    await pool.execute(
      'UPDATE test_equipment SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({ message: 'Test equipment deleted successfully' });
  } catch (error) {
    console.error('Delete test equipment error:', error);
    res.status(500).json({ message: 'Server error deleting test equipment' });
  }
});

// Get test equipment for certificate creation (dropdown)
router.get('/for-certificate', authenticateToken, async (req, res) => {
  try {
    // Get active test equipment
    const [equipment] = await pool.execute(
      `SELECT id, equipment_name, model_number, serial_number, accuracy, range_min, range_max, unit
       FROM test_equipment 
       WHERE is_active = TRUE 
       ORDER BY equipment_name`,
      []
    );

    res.json({ equipment });
  } catch (error) {
    console.error('Get test equipment for certificate error:', error);
    res.status(500).json({ message: 'Server error fetching test equipment' });
  }
});

// Get calibration status overview
router.get('/calibration/status', authenticateToken, async (req, res) => {
  try {
    const [status] = await pool.execute(`
      SELECT 
        COUNT(*) as total_equipment,
        SUM(CASE WHEN next_calibration_date < CURDATE() THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN next_calibration_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as due_soon,
        SUM(CASE WHEN next_calibration_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as valid
      FROM test_equipment 
      WHERE is_active = TRUE
    `);

    const [upcomingCalibrations] = await pool.execute(`
      SELECT equipment_name, next_calibration_date, DATEDIFF(next_calibration_date, CURDATE()) as days_remaining
      FROM test_equipment 
      WHERE is_active = TRUE 
        AND next_calibration_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ORDER BY next_calibration_date ASC
      LIMIT 10
    `);

    res.json({
      status: status[0],
      upcomingCalibrations
    });
  } catch (error) {
    console.error('Get calibration status error:', error);
    res.status(500).json({ message: 'Server error fetching calibration status' });
  }
});

module.exports = router;
