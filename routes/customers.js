const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all customers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, 
             COUNT(ci.id) as instrument_count,
             COUNT(cc.id) as certificate_count
      FROM customers c
      LEFT JOIN customer_instruments ci ON c.id = ci.customer_id AND ci.is_active = TRUE
      LEFT JOIN calibration_certificates cc ON c.id = cc.customer_id
      WHERE c.is_active = TRUE
    `;

    const params = [];

    if (search) {
      query += ` AND (c.company_name LIKE ? OR c.contact_person LIKE ? OR c.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [customers] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM customers WHERE is_active = TRUE';
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (company_name LIKE ? OR contact_person LIKE ? OR email LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error fetching customers' });
  }
});

// Get customer by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get customer details
    const [customers] = await pool.execute(
      'SELECT * FROM customers WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const customer = customers[0];

    // Get customer addresses
    const [addresses] = await pool.execute(
      'SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC',
      [id]
    );

    // Get customer instruments
    const [instruments] = await pool.execute(
      'SELECT * FROM customer_instruments WHERE customer_id = ? AND is_active = TRUE ORDER BY created_at DESC',
      [id]
    );

    // Get recent certificates
    const [certificates] = await pool.execute(
      `SELECT cc.*, ci.instrument_name, ci.model_number, ci.serial_number
       FROM calibration_certificates cc
       JOIN customer_instruments ci ON cc.instrument_id = ci.id
       WHERE cc.customer_id = ?
       ORDER BY cc.created_at DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      customer,
      addresses,
      instruments,
      certificates
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Server error fetching customer' });
  }
});

// Create new customer
router.post('/', [
  authenticateToken,
  requireRole(['admin', 'staff']),
  body('companyName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('contactPerson').notEmpty().trim(),
  body('phone').optional().isMobilePhone()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      companyName,
      contactPerson,
      email,
      phone,
      mobile,
      website,
      gstNumber,
      panNumber,
      addresses
    } = req.body;

    // Check if email already exists
    const [existingCustomers] = await pool.execute(
      'SELECT id FROM customers WHERE email = ?',
      [email]
    );

    if (existingCustomers.length > 0) {
      return res.status(400).json({ message: 'Customer with this email already exists' });
    }

    // Create customer
    const [result] = await pool.execute(
      `INSERT INTO customers (company_name, contact_person, email, phone, mobile, website, gst_number, pan_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [companyName, contactPerson, email, phone, mobile, website, gstNumber, panNumber]
    );

    const customerId = result.insertId;

    // Add addresses if provided
    if (addresses && addresses.length > 0) {
      for (const address of addresses) {
        await pool.execute(
          `INSERT INTO customer_addresses (customer_id, address_type, address_line1, address_line2, city, state, pincode, country, is_default)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            customerId,
            address.addressType || 'both',
            address.addressLine1,
            address.addressLine2 || null,
            address.city,
            address.state,
            address.pincode,
            address.country || 'India',
            address.isDefault || false
          ]
        );
      }
    }

    res.status(201).json({
      message: 'Customer created successfully',
      customerId
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'Server error creating customer' });
  }
});

// Update customer
router.put('/:id', [
  authenticateToken,
  requireRole(['admin', 'staff']),
  body('companyName').optional().notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('contactPerson').optional().notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      companyName,
      contactPerson,
      email,
      phone,
      mobile,
      website,
      gstNumber,
      panNumber
    } = req.body;

    // Check if customer exists
    const [customers] = await pool.execute(
      'SELECT id FROM customers WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check email uniqueness if email is being updated
    if (email) {
      const [existingCustomers] = await pool.execute(
        'SELECT id FROM customers WHERE email = ? AND id != ?',
        [email, id]
      );

      if (existingCustomers.length > 0) {
        return res.status(400).json({ message: 'Customer with this email already exists' });
      }
    }

    // Update customer
    const updateFields = [];
    const updateValues = [];

    if (companyName) {
      updateFields.push('company_name = ?');
      updateValues.push(companyName);
    }
    if (contactPerson) {
      updateFields.push('contact_person = ?');
      updateValues.push(contactPerson);
    }
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (mobile !== undefined) {
      updateFields.push('mobile = ?');
      updateValues.push(mobile);
    }
    if (website !== undefined) {
      updateFields.push('website = ?');
      updateValues.push(website);
    }
    if (gstNumber !== undefined) {
      updateFields.push('gst_number = ?');
      updateValues.push(gstNumber);
    }
    if (panNumber !== undefined) {
      updateFields.push('pan_number = ?');
      updateValues.push(panNumber);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE customers SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Server error updating customer' });
  }
});

// Delete customer (soft delete)
router.delete('/:id', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const [customers] = await pool.execute(
      'SELECT id FROM customers WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if customer has active certificates
    const [certificates] = await pool.execute(
      'SELECT id FROM calibration_certificates WHERE customer_id = ? AND status = "active"',
      [id]
    );

    if (certificates.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete customer with active certificates. Please renew or expire certificates first.' 
      });
    }

    // Soft delete customer
    await pool.execute(
      'UPDATE customers SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Server error deleting customer' });
  }
});

// Add customer address
router.post('/:id/addresses', [
  authenticateToken,
  requireRole(['admin', 'staff']),
  body('addressLine1').notEmpty().trim(),
  body('city').notEmpty().trim(),
  body('state').notEmpty().trim(),
  body('pincode').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      addressType = 'both',
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country = 'India',
      isDefault = false
    } = req.body;

    // Check if customer exists
    const [customers] = await pool.execute(
      'SELECT id FROM customers WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await pool.execute(
        'UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = ?',
        [id]
      );
    }

    // Add address
    const [result] = await pool.execute(
      `INSERT INTO customer_addresses (customer_id, address_type, address_line1, address_line2, city, state, pincode, country, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, addressType, addressLine1, addressLine2, city, state, pincode, country, isDefault]
    );

    res.status(201).json({
      message: 'Address added successfully',
      addressId: result.insertId
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ message: 'Server error adding address' });
  }
});

module.exports = router;
