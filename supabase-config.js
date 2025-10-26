// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://tomvzmhaarpfmiccldly.supabase.co', // Your Supabase project URL
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvbXZ6bWhhYXJwZm1pY2NsZGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDA3MTEsImV4cCI6MjA3NzAxNjcxMX0.dm36b8qdZh5GrILAX0v6oRZPG2XvfzpOL5F_DWgosjc', // Replace with your Supabase anon key
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvbXZ6bWhhYXJwZm1pY2NsZGx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQ0MDcxMSwiZXhwIjoyMDc3MDE2NzExfQ.8pFYW6naJkqJOuVrm6MKcRoUZfGY2ZNwz8wxVfhbkrg' // Replace with your service role key
};

// Database Tables Configuration
const TABLES = {
    users: 'users',
    customers: 'customers',
    instruments: 'instruments',
    certificates: 'certificates',
    test_equipment: 'test_equipment',
    calibration_staff: 'calibration_staff',
    notifications: 'notifications',
    reports: 'reports'
};

// Authentication Configuration
const AUTH_CONFIG = {
    admin: {
        email: 'admin@justinstruments.com',
        password: 'admin123',
        role: 'admin'
    },
    staff: {
        username: 'staff001',
        password: 'staff123',
        role: 'staff'
    },
    customer: {
        customer_id: 'CUST-001',
        otp: '123456',
        role: 'customer'
    }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG, TABLES, AUTH_CONFIG };
} else {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
    window.TABLES = TABLES;
    window.AUTH_CONFIG = AUTH_CONFIG;
}
