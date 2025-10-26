-- Simple Database Schema for JUST INSTRUMENTS
-- Run this in Supabase SQL Editor

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

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    instrument_id UUID REFERENCES instruments(id) ON DELETE CASCADE,
    calibration_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    accuracy VARCHAR(100),
    test_results JSONB,
    certificate_status VARCHAR(50) DEFAULT 'valid' CHECK (certificate_status IN ('valid', 'expired', 'expiring_soon')),
    pdf_path VARCHAR(500),
    qr_code VARCHAR(500),
    digital_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Insert sample instrument
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

-- Insert sample certificate
INSERT INTO certificates (certificate_number, customer_id, instrument_id, calibration_date, expiry_date, accuracy, test_results, certificate_status) 
SELECT 
    'JIC-20241201-001',
    c.id,
    i.id,
    '2024-12-01',
    '2025-12-01',
    '±0.01%',
    '{"voltage": "100.00V", "current": "1.000A", "resistance": "1000.0Ω"}',
    'valid'
FROM customers c, instruments i
WHERE c.customer_id = 'CUST-001' 
AND i.serial_number = 'DM5000-001'
ON CONFLICT (certificate_number) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_instruments_customer_id ON instruments(customer_id);
CREATE INDEX IF NOT EXISTS idx_certificates_customer_id ON certificates(customer_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(certificate_status);
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
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_otp ENABLE ROW LEVEL SECURITY;

-- Create basic policies (allow all for now - you can restrict later)
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON instruments FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON certificates FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON customer_otp FOR ALL USING (true);

-- Success message
SELECT 'Database schema created successfully!' as message;
