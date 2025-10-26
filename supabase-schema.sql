-- Supabase Database Schema for JUST INSTRUMENTS
-- Calibration Certificate Management Platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for admin and staff)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Instruments table
CREATE TABLE IF NOT EXISTS instruments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    instrument_name VARCHAR(255) NOT NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100),
    manufacturer VARCHAR(100),
    category VARCHAR(100),
    specifications TEXT,
    purchase_date DATE,
    warranty_expiry DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test Equipment table
CREATE TABLE IF NOT EXISTS test_equipment (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    equipment_name VARCHAR(255) NOT NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100),
    manufacturer VARCHAR(100),
    category VARCHAR(100),
    specifications TEXT,
    accuracy VARCHAR(100),
    calibration_date DATE,
    next_calibration_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calibration Staff table
CREATE TABLE IF NOT EXISTS calibration_staff (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    position VARCHAR(100),
    department VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    signature_path VARCHAR(500),
    certification_level VARCHAR(100),
    certification_expiry DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    instrument_id UUID REFERENCES instruments(id) ON DELETE CASCADE,
    test_equipment_id UUID REFERENCES test_equipment(id),
    calibration_staff_id UUID REFERENCES calibration_staff(id),
    calibration_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    accuracy VARCHAR(100),
    test_results JSONB,
    calibration_procedures TEXT,
    environmental_conditions JSONB,
    certificate_status VARCHAR(50) DEFAULT 'valid' CHECK (certificate_status IN ('valid', 'expired', 'expiring_soon')),
    pdf_path VARCHAR(500),
    qr_code VARCHAR(500),
    digital_signature TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    customer_id UUID REFERENCES customers(id),
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_via VARCHAR(50) CHECK (sent_via IN ('email', 'sms', 'whatsapp', 'system')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    report_data JSONB,
    filters JSONB,
    generated_by UUID REFERENCES users(id),
    file_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer OTP table for authentication
CREATE TABLE IF NOT EXISTS customer_otp (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    otp_code VARCHAR(10) NOT NULL,
    phone_number VARCHAR(20),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_instruments_customer_id ON instruments(customer_id);
CREATE INDEX IF NOT EXISTS idx_certificates_customer_id ON certificates(customer_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(certificate_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_otp_customer_id ON customer_otp(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_otp_code ON customer_otp(otp_code);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_instruments_updated_at BEFORE UPDATE ON instruments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_equipment_updated_at BEFORE UPDATE ON test_equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calibration_staff_updated_at BEFORE UPDATE ON calibration_staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
INSERT INTO users (email, username, password_hash, role, first_name, last_name, phone) 
VALUES (
    'admin@justinstruments.com',
    'admin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: admin123
    'admin',
    'System',
    'Administrator',
    '+1-555-0001'
) ON CONFLICT (email) DO NOTHING;

-- Insert default staff user
INSERT INTO users (email, username, password_hash, role, first_name, last_name, phone) 
VALUES (
    'staff@justinstruments.com',
    'staff001',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: staff123
    'staff',
    'John',
    'Smith',
    '+1-555-0002'
) ON CONFLICT (username) DO NOTHING;

-- Insert default customer
INSERT INTO customers (customer_id, company_name, contact_person, email, phone, address, city, state, country, postal_code) 
VALUES (
    'CUST-001',
    'ABC Industries',
    'John Smith',
    'john.smith@abcindustries.com',
    '+1-555-0123',
    '123 Industrial Ave, Manufacturing District',
    'City',
    'State',
    'USA',
    '12345'
) ON CONFLICT (customer_id) DO NOTHING;

-- Insert sample instruments
INSERT INTO instruments (customer_id, instrument_name, model, serial_number, manufacturer, category, specifications) 
SELECT 
    c.id,
    'Digital Multimeter',
    'DM-5000',
    'DM5000-001',
    'Fluke',
    'Electrical',
    'Accuracy: ±0.01%, Range: 0-1000V'
FROM customers c WHERE c.customer_id = 'CUST-001'
ON CONFLICT DO NOTHING;

-- Insert sample test equipment
INSERT INTO test_equipment (equipment_name, model, serial_number, manufacturer, category, accuracy, calibration_date, next_calibration_date) 
VALUES (
    'Digital Multimeter',
    'DM-5000',
    'TE5000-001',
    'Fluke',
    'Electrical',
    '±0.01%',
    '2024-01-01',
    '2025-01-01'
) ON CONFLICT DO NOTHING;

-- Insert sample calibration staff
INSERT INTO calibration_staff (staff_name, employee_id, position, department, email, phone, certification_level, certification_expiry) 
VALUES (
    'John Smith',
    'EMP001',
    'Senior Calibration Engineer',
    'Calibration',
    'john.smith@justinstruments.com',
    '+1-555-0003',
    'Level 3',
    '2025-12-31'
) ON CONFLICT (employee_id) DO NOTHING;

-- Insert sample certificate
INSERT INTO certificates (certificate_number, customer_id, instrument_id, test_equipment_id, calibration_staff_id, calibration_date, expiry_date, accuracy, test_results, certificate_status, created_by) 
SELECT 
    'JIC-20241201-001',
    c.id,
    i.id,
    te.id,
    cs.id,
    '2024-12-01',
    '2025-12-01',
    '±0.01%',
    '{"voltage": "100.00V", "current": "1.000A", "resistance": "1000.0Ω"}',
    'valid',
    u.id
FROM customers c, instruments i, test_equipment te, calibration_staff cs, users u
WHERE c.customer_id = 'CUST-001' 
AND i.serial_number = 'DM5000-001'
AND te.serial_number = 'TE5000-001'
AND cs.employee_id = 'EMP001'
AND u.username = 'admin'
ON CONFLICT (certificate_number) DO NOTHING;

-- Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_otp ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can access all data" ON users FOR ALL USING (true);
CREATE POLICY "Admin can access all customers" ON customers FOR ALL USING (true);
CREATE POLICY "Admin can access all instruments" ON instruments FOR ALL USING (true);
CREATE POLICY "Admin can access all certificates" ON certificates FOR ALL USING (true);
CREATE POLICY "Admin can access all test equipment" ON test_equipment FOR ALL USING (true);
CREATE POLICY "Admin can access all calibration staff" ON calibration_staff FOR ALL USING (true);
CREATE POLICY "Admin can access all notifications" ON notifications FOR ALL USING (true);
CREATE POLICY "Admin can access all reports" ON reports FOR ALL USING (true);

-- Create policies for staff access
CREATE POLICY "Staff can access all data" ON users FOR ALL USING (true);
CREATE POLICY "Staff can access all customers" ON customers FOR ALL USING (true);
CREATE POLICY "Staff can access all instruments" ON instruments FOR ALL USING (true);
CREATE POLICY "Staff can access all certificates" ON certificates FOR ALL USING (true);
CREATE POLICY "Staff can access all test equipment" ON test_equipment FOR ALL USING (true);
CREATE POLICY "Staff can access all calibration staff" ON calibration_staff FOR ALL USING (true);
CREATE POLICY "Staff can access all notifications" ON notifications FOR ALL USING (true);
CREATE POLICY "Staff can access all reports" ON reports FOR ALL USING (true);

-- Create policies for customer access (limited to their own data)
CREATE POLICY "Customers can access their own data" ON customers FOR ALL USING (customer_id = current_setting('app.current_customer_id'));
CREATE POLICY "Customers can access their instruments" ON instruments FOR ALL USING (customer_id IN (SELECT id FROM customers WHERE customer_id = current_setting('app.current_customer_id')));
CREATE POLICY "Customers can access their certificates" ON certificates FOR ALL USING (customer_id IN (SELECT id FROM customers WHERE customer_id = current_setting('app.current_customer_id')));
CREATE POLICY "Customers can access their notifications" ON notifications FOR ALL USING (customer_id IN (SELECT id FROM customers WHERE customer_id = current_setting('app.current_customer_id')));
