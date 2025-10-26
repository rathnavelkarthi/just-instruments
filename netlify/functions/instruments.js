// Netlify function for instrument operations with Supabase
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
        // Get all instruments with customer information
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
        // Create new instrument
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
        // Update instrument
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
        // Delete instrument
        const { error: deleteError } = await supabase
          .from('instruments')
          .delete()
          .eq('id', id);
        
        if (deleteError) throw deleteError;
        result = { success: true, message: 'Instrument deleted successfully' };
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
    console.error('Instrument operation error:', error);
    
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
