// Netlify function for customer operations with Supabase
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://tomvzmhaarpfmiccldly.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Check if Supabase is properly configured
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }

    const { method, data, id } = JSON.parse(event.body || '{}');

    let result;

    switch (method) {
      case 'GET':
        // Get all customers
        const { data: customers, error: getError } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (getError) throw getError;
        result = { success: true, data: customers };
        break;

      case 'POST':
        // Create new customer
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert([{
            company_name: data.company_name,
            contact_person: data.contact_person,
            email: data.email,
            phone: data.phone,
            address: data.address,
            customer_id: `CUST-${Date.now()}` // Generate unique customer ID
          }])
          .select()
          .single();
        
        if (createError) throw createError;
        result = { success: true, data: newCustomer };
        break;

      case 'PUT':
        // Update customer
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
        // Delete customer
        const { error: deleteError } = await supabase
          .from('customers')
          .delete()
          .eq('id', id);
        
        if (deleteError) throw deleteError;
        result = { success: true, message: 'Customer deleted successfully' };
        break;

      default:
        throw new Error('Invalid method. Use GET, POST, PUT, or DELETE');
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Customer operation error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
