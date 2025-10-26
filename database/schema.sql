-- Calibration Certificate Management Platform Database Schema
-- Created for JUST INSTRUMENTS Inc.

CREATE DATABASE IF NOT EXISTS calibration_certificates;
USE calibration_certificates;

-- Users table for admin and staff
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') DEFAULT 'staff',
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    mobile VARCHAR(20),
    website VARCHAR(200),
    gst_number VARCHAR(20),
    pan_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customer addresses
CREATE TABLE customer_addresses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    address_type ENUM('billing', 'shipping', 'both') DEFAULT 'both',
    address_line1 VARCHAR(200) NOT NULL,
    address_line2 VARCHAR(200),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Test equipment table
CREATE TABLE test_equipment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_name VARCHAR(200) NOT NULL,
    model_number VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    manufacturer VARCHAR(100),
    calibration_date DATE,
    next_calibration_date DATE,
    certificate_number VARCHAR(100),
    accuracy VARCHAR(100),
    range_min DECIMAL(10,4),
    range_max DECIMAL(10,4),
    unit VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customer instruments
CREATE TABLE customer_instruments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    instrument_name VARCHAR(200) NOT NULL,
    model_number VARCHAR(100),
    serial_number VARCHAR(100),
    manufacturer VARCHAR(100),
    specifications TEXT,
    purchase_date DATE,
    warranty_expiry DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Calibration staff
CREATE TABLE calibration_staff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_name VARCHAR(100) NOT NULL,
    designation VARCHAR(100),
    signature_image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Calibration certificates
CREATE TABLE calibration_certificates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    address_id INT NOT NULL,
    instrument_id INT NOT NULL,
    calibration_date DATE NOT NULL,
    due_date DATE NOT NULL,
    test_equipment_ids JSON, -- Array of test equipment IDs used
    environmental_conditions JSON, -- Temperature, humidity, pressure
    test_results JSON, -- Detailed test results
    remarks TEXT,
    prepared_by INT NOT NULL,
    signature_id INT NOT NULL,
    pdf_path VARCHAR(255),
    qr_code VARCHAR(255),
    status ENUM('active', 'expired', 'renewed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (address_id) REFERENCES customer_addresses(id) ON DELETE CASCADE,
    FOREIGN KEY (instrument_id) REFERENCES customer_instruments(id) ON DELETE CASCADE,
    FOREIGN KEY (prepared_by) REFERENCES users(id),
    FOREIGN KEY (signature_id) REFERENCES calibration_staff(id)
);

-- Notifications
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    certificate_id INT,
    notification_type ENUM('renewal_reminder', 'expiry_alert', 'certificate_ready') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    sent_via ENUM('email', 'sms', 'whatsapp', 'push') NOT NULL,
    sent_at TIMESTAMP NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (certificate_id) REFERENCES calibration_certificates(id) ON DELETE CASCADE
);

-- Mobile app users (for OTP authentication)
CREATE TABLE mobile_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    otp VARCHAR(6),
    otp_expires_at TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    device_token VARCHAR(255),
    platform ENUM('ios', 'android') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Certificate renewals tracking
CREATE TABLE certificate_renewals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    original_certificate_id INT NOT NULL,
    renewed_certificate_id INT NOT NULL,
    renewal_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (original_certificate_id) REFERENCES calibration_certificates(id),
    FOREIGN KEY (renewed_certificate_id) REFERENCES calibration_certificates(id)
);

-- Indexes for better performance
CREATE INDEX idx_certificates_customer ON calibration_certificates(customer_id);
CREATE INDEX idx_certificates_due_date ON calibration_certificates(due_date);
CREATE INDEX idx_certificates_status ON calibration_certificates(status);
CREATE INDEX idx_notifications_customer ON notifications(customer_id);
CREATE INDEX idx_notifications_sent ON notifications(is_sent);
CREATE INDEX idx_mobile_users_customer ON mobile_users(customer_id);
CREATE INDEX idx_mobile_users_email ON mobile_users(email);

-- Insert default admin user
INSERT INTO users (username, email, password, role, first_name, last_name) 
VALUES ('admin', 'admin@justinstruments.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Admin', 'User');

-- Insert sample calibration staff
INSERT INTO calibration_staff (staff_name, designation) VALUES 
('John Smith', 'Senior Calibration Engineer'),
('Sarah Johnson', 'Calibration Technician'),
('Mike Wilson', 'Quality Manager');
