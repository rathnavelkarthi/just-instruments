// Netlify serverless function for authentication
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
    const { username, password, userType } = JSON.parse(event.body);

    // Simulate authentication (replace with real Supabase auth)
    let isValid = false;
    let user = null;

    // Admin authentication
    if (username === 'admin@justinstruments.com' && password === 'admin123') {
      isValid = true;
      user = { email: username, role: 'admin', userType: 'admin' };
    }
    // Staff authentication
    else if (username === 'staff001' && password === 'staff123') {
      isValid = true;
      user = { username, role: 'staff', userType: 'staff' };
    }
    // Customer authentication
    else if (username === 'CUST-001' && password === '123456') {
      isValid = true;
      user = { customer_id: username, role: 'customer', userType: 'customer' };
    }

    if (isValid) {
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          user: user,
          message: 'Authentication successful'
        })
      };
    } else {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'Invalid credentials'
        })
      };
    }

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: 'Server error'
      })
    };
  }
};
