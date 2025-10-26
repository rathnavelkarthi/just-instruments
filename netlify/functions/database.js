// Database connection utility for Netlify Functions
// PostgreSQL connection using environment variables

const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    return { success: true, time: result.rows[0].current_time };
  } catch (error) {
    console.error('Database connection error:', error);
    return { success: false, error: error.message };
  }
}

// Generic query function
async function query(text, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

// Get single record
async function getOne(text, params = []) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

// Get multiple records
async function getMany(text, params = []) {
  const result = await query(text, params);
  return result.rows;
}

// Insert record and return the inserted record
async function insert(table, data) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
  const columns = keys.join(', ');
  
  const text = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
  return await getOne(text, values);
}

// Update record and return the updated record
async function update(table, data, whereClause, whereParams = []) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  
  const text = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`;
  const allParams = [...values, ...whereParams];
  
  return await getOne(text, allParams);
}

// Delete record
async function remove(table, whereClause, params = []) {
  const text = `DELETE FROM ${table} WHERE ${whereClause} RETURNING *`;
  return await getOne(text, params);
}

// Close the pool (call this when shutting down)
async function close() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  getOne,
  getMany,
  insert,
  update,
  remove,
  testConnection,
  close
};
