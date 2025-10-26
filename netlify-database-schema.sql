-- Netlify Database Schema for JUST INSTRUMENTS Calibration Platform
-- PostgreSQL Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    customer_id VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Instruments table
CREATE TABLE instruments (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    instrument_name VARCHAR(255) NOT NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    manufacturer VARCHAR(255),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    specifications JSONB,
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test Equipment table
CREATE TABLE test_equipment (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    equipment_name VARCHAR(255) NOT NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    manufacturer VARCHAR(255),
    last_calibration DATE,
    next_calibration DATE,
    accuracy_specs JSONB,
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calibration Staff table
CREATE TABLE calibration_staff (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    staff_name VARCHAR(255) NOT NULL,
    designation VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    signature_path VARCHAR(500),
    certification_number VARCHAR(100),
    certification_expiry DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certificates table
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    instrument_id INTEGER REFERENCES instruments(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    staff_id INTEGER REFERENCES calibration_staff(id),
    calibration_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'valid' CHECK (status IN ('valid', 'expired', 'cancelled')),
    pdf_path VARCHAR(500),
    qr_code VARCHAR(500),
    calibration_data JSONB,
    environmental_conditions JSONB,
    traceability_info JSONB,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) NOT NULL, -- 'certificate_expiry', 'calibration_due', 'equipment_due', etc.
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    related_id INTEGER, -- ID of related record (certificate, instrument, etc.)
    related_type VARCHAR(50), -- Type of related record
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Reports table
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- 'calibration_summary', 'expiry_report', 'equipment_status', etc.
    parameters JSONB,
    generated_by INTEGER REFERENCES users(id),
    file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_customers_customer_id ON customers(customer_id);
CREATE INDEX idx_customers_company_name ON customers(company_name);
CREATE INDEX idx_instruments_serial_number ON instruments(serial_number);
CREATE INDEX idx_instruments_customer_id ON instruments(customer_id);
CREATE INDEX idx_certificates_certificate_number ON certificates(certificate_number);
CREATE INDEX idx_certificates_calibration_date ON certificates(calibration_date);
CREATE INDEX idx_certificates_expiry_date ON certificates(expiry_date);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_instruments_updated_at BEFORE UPDATE ON instruments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_equipment_updated_at BEFORE UPDATE ON test_equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calibration_staff_updated_at BEFORE UPDATE ON calibration_staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial admin user
INSERT INTO users (email, password_hash, role) VALUES 
('admin@justinstruments.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert sample data
INSERT INTO customers (customer_id, company_name, contact_person, email, phone, address) VALUES 
('CUST-001', 'ABC Industries', 'John Doe', 'john@abccorp.com', '+1 555-0123', '123 Business St, City, State 12345'),
('CUST-002', 'XYZ Corporation', 'Jane Smith', 'jane@xyzcorp.com', '+1 555-0456', '456 Industrial Ave, City, State 67890'),
('CUST-003', 'DEF Limited', 'Bob Johnson', 'bob@def.com', '+1 555-0789', '789 Tech Blvd, City, State 54321');

INSERT INTO calibration_staff (staff_name, designation, email, phone, certification_number) VALUES 
('John Smith', 'Senior Calibration Technician', 'john.smith@justinstruments.com', '+1 555-0100', 'CERT-2024-001'),
('Sarah Wilson', 'Calibration Engineer', 'sarah.wilson@justinstruments.com', '+1 555-0101', 'CERT-2024-002'),
('Mike Brown', 'Lead Technician', 'mike.brown@justinstruments.com', '+1 555-0102', 'CERT-2024-003');

INSERT INTO test_equipment (equipment_name, model, serial_number, manufacturer, last_calibration, next_calibration) VALUES 
('Fluke 87V Multimeter', '87V', 'FL-2024-001', 'Fluke', '2024-11-01', '2025-05-01'),
('Keysight 34465A DMM', '34465A', 'KS-2024-001', 'Keysight', '2024-10-15', '2025-04-15'),
('Tektronix TBS1052B Oscilloscope', 'TBS1052B', 'TK-2024-001', 'Tektronix', '2024-09-20', '2025-03-20');

INSERT INTO instruments (instrument_name, model, serial_number, manufacturer, customer_id, specifications) VALUES 
('Digital Multimeter', 'DM-5000', 'DM-2024-001', 'Fluke', 1, '{"range": "0-1000V", "accuracy": "±0.1%", "resolution": "0.001V"}'),
('Oscilloscope', 'OSC-2000', 'OSC-2024-001', 'Tektronix', 1, '{"bandwidth": "200MHz", "channels": 4, "sampling_rate": "1GS/s"}'),
('Function Generator', 'FG-1000', 'FG-2024-001', 'Keysight', 2, '{"frequency_range": "0.1Hz-25MHz", "amplitude": "10Vpp", "waveforms": ["sine", "square", "triangle"]}');

INSERT INTO certificates (certificate_number, instrument_id, customer_id, staff_id, calibration_date, expiry_date, status) VALUES 
('JIC-20241201-001', 1, 1, 1, '2024-12-01', '2025-12-01', 'valid'),
('JIC-20241201-002', 2, 1, 2, '2024-12-01', '2025-12-01', 'valid'),
('JIC-20241201-003', 3, 2, 1, '2024-12-01', '2025-12-01', 'valid');

-- Create views for common queries
CREATE VIEW certificate_summary AS
SELECT 
    c.certificate_number,
    c.calibration_date,
    c.expiry_date,
    c.status,
    i.instrument_name,
    i.model,
    i.serial_number,
    cust.company_name,
    cust.contact_person,
    cs.staff_name
FROM certificates c
JOIN instruments i ON c.instrument_id = i.id
JOIN customers cust ON c.customer_id = cust.id
JOIN calibration_staff cs ON c.staff_id = cs.id;

CREATE VIEW expiring_certificates AS
SELECT 
    certificate_number,
    instrument_name,
    company_name,
    expiry_date,
    (expiry_date - CURRENT_DATE) as days_until_expiry
FROM certificate_summary
WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
AND status = 'valid'
ORDER BY expiry_date ASC;

-- Grant permissions (adjust as needed for your security requirements)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
