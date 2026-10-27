import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create connection pool with environment variables and sensible defaults
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campuseats_graphql',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

/**
 * Executes a parameterized SQL query safely.
 * @param {string} sql - Parameterized SQL query
 * @param {Array} params - Array of parameter values
 * @returns {Promise<Array>} Query results
 */
export async function query(sql, params = []) {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    // Redact password or sensitive connection info from error messages
    const safeError = new Error(`Database query failed: ${error.message}`);
    safeError.code = error.code;
    throw safeError;
  }
}

/**
 * Tests connection to MySQL database.
 * Returns true if connection succeeds, throws descriptive error otherwise.
 */
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    const safeMsg = `Cannot connect to MySQL database '${process.env.DB_NAME || 'campuseats_graphql'}' on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'} (Error: ${error.code || error.message})`;
    throw new Error(safeMsg);
  }
}

export default pool;
