const express = require('express');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole, authenticateCustomer } = require('../middleware/auth');

const router = express.Router();

// Generate certificate number
const generateCertificateNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `JIC-${year}${month}${day}-${random}`;
};

// Generate PDF certificate
const generatePDFCertificate = async (certificateData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const fileName = `certificate-${certificateData.certificateNumber}.pdf`;
      const filePath = path.join('uploads', 'certificates', fileName);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('JUST INSTRUMENTS INC.', 50, 50, { align: 'center' });
      
      doc.fontSize(16)
         .font('Helvetica')
         .text('CALIBRATION CERTIFICATE', 50, 80, { align: 'center' });

      // Certificate details
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Certificate No: ${certificateData.certificateNumber}`, 50, 120)
         .text(`Date: ${certificateData.calibrationDate}`, 50, 140)
         .text(`Due Date: ${certificateData.dueDate}`, 50, 160);

      // Customer details
      doc.text('Customer Details:', 50, 200)
         .text(`Company: ${certificateData.customer.companyName}`, 50, 220)
         .text(`Contact: ${certificateData.customer.contactPerson}`, 50, 240)
         .text(`Email: ${certificateData.customer.email}`, 50, 260);

      // Address
      if (certificateData.address) {
        doc.text('Address:', 50, 300)
           .text(certificateData.address.addressLine1, 50, 320);
        if (certificateData.address.addressLine2) {
          doc.text(certificateData.address.addressLine2, 50, 340);
        }
        doc.text(`${certificateData.address.city}, ${certificateData.address.state} - ${certificateData.address.pincode}`, 50, 360);
      }

      // Instrument details
      doc.text('Instrument Details:', 50, 400)
         .text(`Name: ${certificateData.instrument.instrumentName}`, 50, 420)
         .text(`Model: ${certificateData.instrument.modelNumber || 'N/A'}`, 50, 440)
         .text(`Serial: ${certificateData.instrument.serialNumber || 'N/A'}`, 50, 460)
         .text(`Manufacturer: ${certificateData.instrument.manufacturer || 'N/A'}`, 50, 480);

      // Test equipment used
      if (certificateData.testEquipment && certificateData.testEquipment.length > 0) {
        doc.text('Test Equipment Used:', 50, 520);
        let yPos = 540;
        certificateData.testEquipment.forEach((equipment, index) => {
          doc.text(`${index + 1}. ${equipment.equipmentName} (${equipment.modelNumber})`, 50, yPos);
          yPos += 20;
        });
      }

      // Environmental conditions
      if (certificateData.environmentalConditions) {
        doc.text('Environmental Conditions:', 50, yPos + 20);
        yPos += 40;
        if (certificateData.environmentalConditions.temperature) {
          doc.text(`Temperature: ${certificateData.environmentalConditions.temperature}°C`, 50, yPos);
          yPos += 20;
        }
        if (certificateData.environmentalConditions.humidity) {
          doc.text(`Humidity: ${certificateData.environmentalConditions.humidity}%`, 50, yPos);
          yPos += 20;
        }
        if (certificateData.environmentalConditions.pressure) {
          doc.text(`Pressure: ${certificateData.environmentalConditions.pressure}`, 50, yPos);
          yPos += 20;
        }
      }

      // Test results
      if (certificateData.testResults && certificateData.testResults.length > 0) {
        doc.text('Test Results:', 50, yPos + 20);
        yPos += 40;
        certificateData.testResults.forEach((result, index) => {
          doc.text(`${index + 1}. ${result.testPoint}: ${result.measuredValue} ${result.unit} (Expected: ${result.expectedValue} ${result.unit})`, 50, yPos);
          yPos += 20;
        });
      }

      // Remarks
      if (certificateData.remarks) {
        doc.text('Remarks:', 50, yPos + 20)
           .text(certificateData.remarks, 50, yPos + 40);
        yPos += 80;
      }

      // Signature section
      const signatureY = Math.max(yPos + 40, 700);
      doc.text('Prepared by:', 50, signatureY)
         .text(certificateData.preparedBy.firstName + ' ' + certificateData.preparedBy.lastName, 50, signatureY + 20)
         .text('Date:', 300, signatureY)
         .text(certificateData.calibrationDate, 300, signatureY + 20);

      // QR Code
      try {
        const qrCodeData = {
          certificateNumber: certificateData.certificateNumber,
          customerId: certificateData.customer.id,
          instrumentId: certificateData.instrument.id,
          calibrationDate: certificateData.calibrationDate,
          dueDate: certificateData.dueDate
        };

        const qrCodeString = await QRCode.toString(JSON.stringify(qrCodeData), { type: 'png' });
        const qrCodeBuffer = Buffer.from(qrCodeString, 'base64');
        
        doc.image(qrCodeBuffer, 450, signatureY, { width: 100, height: 100 });
        doc.text('QR Code', 450, signatureY + 110, { align: 'center' });
      } catch (qrError) {
        console.error('QR Code generation error:', qrError);
      }

      doc.end();

      stream.on('finish', () => {
        resolve({
          filePath,
          fileName,
          relativePath: `/uploads/certificates/${fileName}`
        });
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

// Get all certificates
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', customerId = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT cc.*, 
             c.company_name, c.contact_person, c.email,
             ci.instrument_name, ci.model_number, ci.serial_number,
             u.first_name, u.last_name,
             cs.staff_name,
             CASE 
               WHEN cc.due_date < CURDATE() THEN 'expired'
               WHEN cc.due_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
               ELSE 'active'
             END as status_display
      FROM calibration_certificates cc
      JOIN customers c ON cc.customer_id = c.id
      JOIN customer_instruments ci ON cc.instrument_id = ci.id
      JOIN users u ON cc.prepared_by = u.id
      JOIN calibration_staff cs ON cc.signature_id = cs.id
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      query += ` AND (cc.certificate_number LIKE ? OR c.company_name LIKE ? OR ci.instrument_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      if (status === 'expired') {
        query += ` AND cc.due_date < CURDATE()`;
      } else if (status === 'expiring_soon') {
        query += ` AND cc.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`;
      } else if (status === 'active') {
        query += ` AND cc.due_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY)`;
      }
    }

    if (customerId) {
      query += ` AND cc.customer_id = ?`;
      params.push(customerId);
    }

    query += ` ORDER BY cc.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [certificates] = await pool.execute(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM calibration_certificates cc
      JOIN customers c ON cc.customer_id = c.id
      JOIN customer_instruments ci ON cc.instrument_id = ci.id
      WHERE 1=1
    `;
    const countParams = [];

    if (search) {
      countQuery += ` AND (cc.certificate_number LIKE ? OR c.company_name LIKE ? OR ci.instrument_name LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      if (status === 'expired') {
        countQuery += ` AND cc.due_date < CURDATE()`;
      } else if (status === 'expiring_soon') {
        countQuery += ` AND cc.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`;
      } else if (status === 'active') {
        countQuery += ` AND cc.due_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY)`;
      }
    }

    if (customerId) {
      countQuery += ` AND cc.customer_id = ?`;
      countParams.push(customerId);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      certificates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ message: 'Server error fetching certificates' });
  }
});

// Get certificate by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [certificates] = await pool.execute(`
      SELECT cc.*, 
             c.company_name, c.contact_person, c.email, c.phone,
             ca.address_line1, ca.address_line2, ca.city, ca.state, ca.pincode, ca.country,
             ci.instrument_name, ci.model_number, ci.serial_number, ci.manufacturer, ci.specifications,
             u.first_name, u.last_name,
             cs.staff_name, cs.signature_image
      FROM calibration_certificates cc
      JOIN customers c ON cc.customer_id = c.id
      JOIN customer_addresses ca ON cc.address_id = ca.id
      JOIN customer_instruments ci ON cc.instrument_id = ci.id
      JOIN users u ON cc.prepared_by = u.id
      JOIN calibration_staff cs ON cc.signature_id = cs.id
      WHERE cc.id = ?
    `, [id]);

    if (certificates.length === 0) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const certificate = certificates[0];

    // Get test equipment details if available
    let testEquipment = [];
    if (certificate.test_equipment_ids) {
      const equipmentIds = JSON.parse(certificate.test_equipment_ids);
      if (equipmentIds.length > 0) {
        const [equipment] = await pool.execute(
          `SELECT id, equipment_name, model_number, serial_number, accuracy, range_min, range_max, unit
           FROM test_equipment 
           WHERE id IN (${equipmentIds.map(() => '?').join(',')})`,
          equipmentIds
        );
        testEquipment = equipment;
      }
    }

    res.json({
      certificate: {
        ...certificate,
        testEquipment,
        environmentalConditions: certificate.environmental_conditions ? JSON.parse(certificate.environmental_conditions) : null,
        testResults: certificate.test_results ? JSON.parse(certificate.test_results) : null
      }
    });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ message: 'Server error fetching certificate' });
  }
});

// Create new certificate
router.post('/', [
  authenticateToken,
  requireRole(['admin', 'staff']),
  body('customerId').isInt(),
  body('addressId').isInt(),
  body('instrumentId').isInt(),
  body('calibrationDate').isISO8601(),
  body('dueDate').isISO8601(),
  body('preparedBy').isInt(),
  body('signatureId').isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      customerId,
      addressId,
      instrumentId,
      calibrationDate,
      dueDate,
      testEquipmentIds = [],
      environmentalConditions = {},
      testResults = [],
      remarks,
      preparedBy,
      signatureId
    } = req.body;

    // Generate certificate number
    const certificateNumber = generateCertificateNumber();

    // Create certificate record
    const [result] = await pool.execute(
      `INSERT INTO calibration_certificates (certificate_number, customer_id, address_id, instrument_id, calibration_date, due_date, test_equipment_ids, environmental_conditions, test_results, remarks, prepared_by, signature_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        certificateNumber,
        customerId,
        addressId,
        instrumentId,
        calibrationDate,
        dueDate,
        JSON.stringify(testEquipmentIds),
        JSON.stringify(environmentalConditions),
        JSON.stringify(testResults),
        remarks,
        preparedBy,
        signatureId
      ]
    );

    const certificateId = result.insertId;

    // Get certificate data for PDF generation
    const [certificateData] = await pool.execute(`
      SELECT cc.*, 
             c.company_name, c.contact_person, c.email,
             ca.address_line1, ca.address_line2, ca.city, ca.state, ca.pincode, ca.country,
             ci.instrument_name, ci.model_number, ci.serial_number, ci.manufacturer,
             u.first_name, u.last_name,
             cs.staff_name
      FROM calibration_certificates cc
      JOIN customers c ON cc.customer_id = c.id
      JOIN customer_addresses ca ON cc.address_id = ca.id
      JOIN customer_instruments ci ON cc.instrument_id = ci.id
      JOIN users u ON cc.prepared_by = u.id
      JOIN calibration_staff cs ON cc.signature_id = cs.id
      WHERE cc.id = ?
    `, [certificateId]);

    const certificate = certificateData[0];

    // Get test equipment details
    let testEquipment = [];
    if (testEquipmentIds.length > 0) {
      const [equipment] = await pool.execute(
        `SELECT id, equipment_name, model_number, serial_number, accuracy, range_min, range_max, unit
         FROM test_equipment 
         WHERE id IN (${testEquipmentIds.map(() => '?').join(',')})`,
        testEquipmentIds
      );
      testEquipment = equipment;
    }

    // Generate PDF
    const pdfData = {
      certificateNumber: certificate.certificate_number,
      calibrationDate: certificate.calibration_date,
      dueDate: certificate.due_date,
      customer: {
        id: certificate.customer_id,
        companyName: certificate.company_name,
        contactPerson: certificate.contact_person,
        email: certificate.email
      },
      address: {
        addressLine1: certificate.address_line1,
        addressLine2: certificate.address_line2,
        city: certificate.city,
        state: certificate.state,
        pincode: certificate.pincode,
        country: certificate.country
      },
      instrument: {
        id: certificate.instrument_id,
        instrumentName: certificate.instrument_name,
        modelNumber: certificate.model_number,
        serialNumber: certificate.serial_number,
        manufacturer: certificate.manufacturer
      },
      testEquipment,
      environmentalConditions,
      testResults,
      remarks: certificate.remarks,
      preparedBy: {
        firstName: certificate.first_name,
        lastName: certificate.last_name
      }
    };

    const pdfResult = await generatePDFCertificate(pdfData);

    // Update certificate with PDF path
    await pool.execute(
      'UPDATE calibration_certificates SET pdf_path = ? WHERE id = ?',
      [pdfResult.relativePath, certificateId]
    );

    res.status(201).json({
      message: 'Certificate created successfully',
      certificateId,
      certificateNumber,
      pdfPath: pdfResult.relativePath
    });
  } catch (error) {
    console.error('Create certificate error:', error);
    res.status(500).json({ message: 'Server error creating certificate' });
  }
});

// Download certificate PDF
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [certificates] = await pool.execute(
      'SELECT pdf_path FROM calibration_certificates WHERE id = ?',
      [id]
    );

    if (certificates.length === 0) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const pdfPath = certificates[0].pdf_path;
    if (!pdfPath) {
      return res.status(404).json({ message: 'PDF not found for this certificate' });
    }

    const fullPath = path.join(process.cwd(), pdfPath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'PDF file not found' });
    }

    res.download(fullPath);
  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({ message: 'Server error downloading certificate' });
  }
});

// Customer certificates (for mobile app and web portal)
router.get('/customer/my-certificates', authenticateCustomer, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT cc.*, 
             ci.instrument_name, ci.model_number, ci.serial_number,
             CASE 
               WHEN cc.due_date < CURDATE() THEN 'expired'
               WHEN cc.due_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
               ELSE 'active'
             END as status_display
      FROM calibration_certificates cc
      JOIN customer_instruments ci ON cc.instrument_id = ci.id
      WHERE cc.customer_id = ?
    `;

    const params = [req.customer.id];

    if (status) {
      if (status === 'expired') {
        query += ` AND cc.due_date < CURDATE()`;
      } else if (status === 'expiring_soon') {
        query += ` AND cc.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`;
      } else if (status === 'active') {
        query += ` AND cc.due_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY)`;
      }
    }

    query += ` ORDER BY cc.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [certificates] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM calibration_certificates WHERE customer_id = ?';
    const countParams = [req.customer.id];
    
    if (status) {
      if (status === 'expired') {
        countQuery += ` AND due_date < CURDATE()`;
      } else if (status === 'expiring_soon') {
        countQuery += ` AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`;
      } else if (status === 'active') {
        countQuery += ` AND due_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY)`;
      }
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      certificates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customer certificates error:', error);
    res.status(500).json({ message: 'Server error fetching certificates' });
  }
});

module.exports = router;
