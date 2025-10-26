const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://tomvzmhaarpfmiccldly.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
    res.render('login');
});

app.get('/dashboard', async (req, res) => {
    try {
        // Load data from Supabase
        const [customersResult, instrumentsResult] = await Promise.all([
            supabase.from('customers').select('*').order('created_at', { ascending: false }),
            supabase.from('instruments').select('*, customers(*)').order('created_at', { ascending: false })
        ]);

        const customers = customersResult.data || [];
        const instruments = instrumentsResult.data || [];

        res.render('dashboard', {
            customers,
            instruments,
            user: { name: 'Admin User', role: 'admin' }
        });
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        res.render('dashboard', {
            customers: [],
            instruments: [],
            user: { name: 'Admin User', role: 'admin' }
        });
    }
});

// API Routes
app.post('/api/customers', async (req, res) => {
    try {
        const { method, data, id } = req.body;

        let result;
        switch (method) {
            case 'GET':
                const { data: customers, error: getError } = await supabase
                    .from('customers')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (getError) throw getError;
                result = { success: true, data: customers };
                break;

            case 'POST':
                const { data: newCustomer, error: createError } = await supabase
                    .from('customers')
                    .insert([{
                        company_name: data.company_name,
                        contact_person: data.contact_person,
                        email: data.email,
                        phone: data.phone,
                        address: data.address,
                        customer_id: `CUST-${Date.now()}`
                    }])
                    .select()
                    .single();
                
                if (createError) throw createError;
                result = { success: true, data: newCustomer };
                break;

            case 'PUT':
                const { data: updatedCustomer, error: updateError } = await supabase
                    .from('customers')
                    .update({
                        company_name: data.company_name,
                        contact_person: data.contact_person,
                        email: data.email,
                        phone: data.phone,
                        address: data.address
                    })
                    .eq('id', id)
                    .select()
                    .single();
                
                if (updateError) throw updateError;
                result = { success: true, data: updatedCustomer };
                break;

            case 'DELETE':
                const { error: deleteError } = await supabase
                    .from('customers')
                    .delete()
                    .eq('id', id);
                
                if (deleteError) throw deleteError;
                result = { success: true, message: 'Customer deleted successfully' };
                break;

            default:
                throw new Error('Invalid method');
        }

        res.json(result);
    } catch (error) {
        console.error('Customer operation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/instruments', async (req, res) => {
    try {
        const { method, data, id } = req.body;

        let result;
        switch (method) {
            case 'GET':
                const { data: instruments, error: getError } = await supabase
                    .from('instruments')
                    .select(`
                        *,
                        customers!inner(
                            id,
                            company_name,
                            contact_person
                        )
                    `)
                    .order('created_at', { ascending: false });
                
                if (getError) throw getError;
                result = { success: true, data: instruments };
                break;

            case 'POST':
                const { data: newInstrument, error: createError } = await supabase
                    .from('instruments')
                    .insert([{
                        instrument_name: data.instrument_name,
                        model: data.model,
                        serial_number: data.serial_number,
                        customer_id: data.customer_id,
                        specifications: data.specifications ? JSON.parse(data.specifications) : null,
                        manufacturer: data.manufacturer || null
                    }])
                    .select(`
                        *,
                        customers!inner(
                            id,
                            company_name,
                            contact_person
                        )
                    `)
                    .single();
                
                if (createError) throw createError;
                result = { success: true, data: newInstrument };
                break;

            case 'PUT':
                const { data: updatedInstrument, error: updateError } = await supabase
                    .from('instruments')
                    .update({
                        instrument_name: data.instrument_name,
                        model: data.model,
                        serial_number: data.serial_number,
                        customer_id: data.customer_id,
                        specifications: data.specifications ? JSON.parse(data.specifications) : null,
                        manufacturer: data.manufacturer || null
                    })
                    .eq('id', id)
                    .select(`
                        *,
                        customers!inner(
                            id,
                            company_name,
                            contact_person
                        )
                    `)
                    .single();
                
                if (updateError) throw updateError;
                result = { success: true, data: updatedInstrument };
                break;

            case 'DELETE':
                const { error: deleteError } = await supabase
                    .from('instruments')
                    .delete()
                    .eq('id', id);
                
                if (deleteError) throw deleteError;
                result = { success: true, message: 'Instrument deleted successfully' };
                break;

            default:
                throw new Error('Invalid method');
        }

        res.json(result);
    } catch (error) {
        console.error('Instrument operation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Authentication route
app.post('/api/auth', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Simple authentication logic
        let isValid = false;
        let user = null;

        if (username === 'admin@justinstruments.com' && password === 'admin123') {
            isValid = true;
            user = { email: username, role: 'admin', userType: 'admin' };
        } else if (username === 'staff001' && password === 'staff123') {
            isValid = true;
            user = { username, role: 'staff', userType: 'staff' };
        } else if (username === 'CUST-001' && password === '123456') {
            isValid = true;
            user = { customer_id: username, role: 'customer', userType: 'customer' };
        }

        if (isValid) {
            res.json({
                success: true,
                user: user,
                message: 'Authentication successful'
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 JUST INSTRUMENTS Calibration Platform running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`🔐 Login: http://localhost:${PORT}/`);
});

module.exports = app;
