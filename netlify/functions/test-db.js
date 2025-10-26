// Test database connection for Netlify Functions
const db = require('./database');

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
    // Test database connection
    const connectionTest = await db.testConnection();
    
    if (!connectionTest.success) {
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'Database connection failed',
          details: connectionTest.error
        })
      };
    }

    // Get some basic statistics
    const stats = await Promise.all([
      db.getOne('SELECT COUNT(*) as count FROM users'),
      db.getOne('SELECT COUNT(*) as count FROM customers'),
      db.getOne('SELECT COUNT(*) as count FROM instruments'),
      db.getOne('SELECT COUNT(*) as count FROM certificates'),
      db.getOne('SELECT COUNT(*) as count FROM test_equipment'),
      db.getOne('SELECT COUNT(*) as count FROM calibration_staff')
    ]);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Database connected successfully',
        timestamp: connectionTest.time,
        statistics: {
          users: parseInt(stats[0].count),
          customers: parseInt(stats[1].count),
          instruments: parseInt(stats[2].count),
          certificates: parseInt(stats[3].count),
          test_equipment: parseInt(stats[4].count),
          calibration_staff: parseInt(stats[5].count)
        }
      })
    };

  } catch (error) {
    console.error('Database test error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: 'Database test failed',
        details: error.message
      })
    };
  }
};
