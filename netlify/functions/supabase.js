// Netlify serverless function for Supabase operations
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
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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

    const { operation, table, data, filters } = JSON.parse(event.body);

    let result;

    switch (operation) {
      case 'get':
        const { data: getData, error: getError } = await supabase
          .from(table)
          .select('*')
          .match(filters || {});
        
        if (getError) throw getError;
        result = { success: true, data: getData };
        break;

      case 'create':
        const { data: createData, error: createError } = await supabase
          .from(table)
          .insert(data);
        
        if (createError) throw createError;
        result = { success: true, data: createData };
        break;

      case 'update':
        const { data: updateData, error: updateError } = await supabase
          .from(table)
          .update(data)
          .match(filters || {});
        
        if (updateError) throw updateError;
        result = { success: true, data: updateData };
        break;

      case 'delete':
        const { data: deleteData, error: deleteError } = await supabase
          .from(table)
          .delete()
          .match(filters || {});
        
        if (deleteError) throw deleteError;
        result = { success: true, data: deleteData };
        break;

      default:
        throw new Error('Invalid operation');
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
