// Supabase Integration for JUST INSTRUMENTS
// Calibration Certificate Management Platform

class SupabaseIntegration {
    constructor() {
        this.supabase = null;
        this.isInitialized = false;
    }

    // Initialize Supabase client
    async initialize() {
        try {
            // Check if Supabase is available
            if (typeof supabase === 'undefined') {
                console.warn('Supabase not loaded. Using local authentication.');
                return false;
            }

            // Initialize Supabase client
            this.supabase = supabase.createClient(
                window.SUPABASE_CONFIG?.url || 'YOUR_SUPABASE_URL',
                window.SUPABASE_CONFIG?.anonKey || 'YOUR_SUPABASE_ANON_KEY'
            );

            this.isInitialized = true;
            console.log('Supabase initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            return false;
        }
    }

    // Authentication methods
    async authenticateUser(credentials) {
        if (!this.isInitialized) {
            return this.localAuthentication(credentials);
        }

        try {
            const { username, password } = credentials;
            
            // Detect user type
            const userType = this.detectUserType(username);
            
            if (userType === 'admin' || userType === 'staff') {
                // Authenticate admin/staff
                const { data, error } = await this.supabase.auth.signInWithPassword({
                    email: username,
                    password: password
                });
                
                if (error) throw error;
                return { success: true, user: data.user, userType };
            } else if (userType === 'customer') {
                // Authenticate customer with OTP
                return await this.authenticateCustomer(username, password);
            }
        } catch (error) {
            console.error('Authentication error:', error);
            return { success: false, error: error.message };
        }
    }

    // Customer authentication with OTP
    async authenticateCustomer(customerId, otp) {
        try {
            const { data, error } = await this.supabase
                .from('customer_otp')
                .select('*')
                .eq('customer_id', customerId)
                .eq('otp_code', otp)
                .eq('is_used', false)
                .gt('expires_at', new Date().toISOString())
                .single();

            if (error) throw error;

            // Mark OTP as used
            await this.supabase
                .from('customer_otp')
                .update({ is_used: true })
                .eq('id', data.id);

            // Get customer data
            const { data: customer, error: customerError } = await this.supabase
                .from('customers')
                .select('*')
                .eq('customer_id', customerId)
                .single();

            if (customerError) throw customerError;

            return { success: true, user: customer, userType: 'customer' };
        } catch (error) {
            console.error('Customer authentication error:', error);
            return { success: false, error: error.message };
        }
    }

    // Local authentication fallback
    localAuthentication(credentials) {
        const { username, password } = credentials;
        
        // Admin authentication
        if (username === 'admin@justinstruments.com' && password === 'admin123') {
            return { success: true, user: { email: username, role: 'admin' }, userType: 'admin' };
        }
        
        // Staff authentication
        if (username === 'staff001' && password === 'staff123') {
            return { success: true, user: { username, role: 'staff' }, userType: 'staff' };
        }
        
        // Customer authentication
        if (username === 'CUST-001' && password === '123456') {
            return { success: true, user: { customer_id: username, role: 'customer' }, userType: 'customer' };
        }
        
        return { success: false, error: 'Invalid credentials' };
    }

    // Detect user type based on credentials
    detectUserType(username) {
        if (username.includes('@') && username.includes('admin')) {
            return 'admin';
        }
        if (username.startsWith('staff') || username === 'staff001') {
            return 'staff';
        }
        if (username.startsWith('CUST-') || username === 'CUST-001') {
            return 'customer';
        }
        return null;
    }

    // Send OTP to customer
    async sendOTP(customerId, phoneNumber) {
        if (!this.isInitialized) {
            // Local OTP simulation
            return { success: true, otp: '123456' };
        }

        try {
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            const { error } = await this.supabase
                .from('customer_otp')
                .insert({
                    customer_id: customerId,
                    otp_code: otpCode,
                    phone_number: phoneNumber,
                    expires_at: expiresAt.toISOString()
                });

            if (error) throw error;

            // In production, you would send SMS here
            console.log(`OTP sent to ${phoneNumber}: ${otpCode}`);
            
            return { success: true, otp: otpCode };
        } catch (error) {
            console.error('OTP send error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get customer certificates
    async getCustomerCertificates(customerId) {
        if (!this.isInitialized) {
            return this.getLocalCertificates();
        }

        try {
            const { data, error } = await this.supabase
                .from('certificates')
                .select(`
                    *,
                    customers!inner(customer_id, company_name),
                    instruments!inner(instrument_name, model, serial_number),
                    calibration_staff!inner(staff_name)
                `)
                .eq('customers.customer_id', customerId);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get certificates error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get local certificates (fallback)
    getLocalCertificates() {
        return {
            success: true,
            data: [
                {
                    certificate_number: 'JIC-20241201-001',
                    calibration_date: '2024-12-01',
                    expiry_date: '2025-12-01',
                    certificate_status: 'valid',
                    customers: { company_name: 'ABC Industries' },
                    instruments: { instrument_name: 'Digital Multimeter', model: 'DM-5000' },
                    calibration_staff: { staff_name: 'John Smith' }
                }
            ]
        };
    }

    // Get dashboard statistics
    async getDashboardStats() {
        if (!this.isInitialized) {
            return this.getLocalStats();
        }

        try {
            const [certificates, customers, instruments] = await Promise.all([
                this.supabase.from('certificates').select('*'),
                this.supabase.from('customers').select('*'),
                this.supabase.from('instruments').select('*')
            ]);

            return {
                success: true,
                data: {
                    totalCertificates: certificates.data?.length || 0,
                    totalCustomers: customers.data?.length || 0,
                    totalInstruments: instruments.data?.length || 0
                }
            };
        } catch (error) {
            console.error('Get stats error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get local stats (fallback)
    getLocalStats() {
        return {
            success: true,
            data: {
                totalCertificates: 12,
                totalCustomers: 1,
                totalInstruments: 8,
                validCertificates: 10,
                expiringCertificates: 2
            }
        };
    }

    // Create certificate
    async createCertificate(certificateData) {
        if (!this.isInitialized) {
            return { success: true, message: 'Certificate created locally' };
        }

        try {
            const { data, error } = await this.supabase
                .from('certificates')
                .insert(certificateData)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Create certificate error:', error);
            return { success: false, error: error.message };
        }
    }

    // Update certificate
    async updateCertificate(certificateId, updateData) {
        if (!this.isInitialized) {
            return { success: true, message: 'Certificate updated locally' };
        }

        try {
            const { data, error } = await this.supabase
                .from('certificates')
                .update(updateData)
                .eq('id', certificateId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Update certificate error:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete certificate
    async deleteCertificate(certificateId) {
        if (!this.isInitialized) {
            return { success: true, message: 'Certificate deleted locally' };
        }

        try {
            const { error } = await this.supabase
                .from('certificates')
                .delete()
                .eq('id', certificateId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete certificate error:', error);
            return { success: false, error: error.message };
        }
    }

    // Real-time subscriptions
    subscribeToCertificates(callback) {
        if (!this.isInitialized) {
            console.warn('Supabase not initialized. Real-time updates disabled.');
            return null;
        }

        return this.supabase
            .channel('certificates')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'certificates' }, 
                callback
            )
            .subscribe();
    }

    // Logout
    async logout() {
        if (!this.isInitialized) {
            return { success: true };
        }

        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create global instance
window.supabaseIntegration = new SupabaseIntegration();

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await window.supabaseIntegration.initialize();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseIntegration;
}
