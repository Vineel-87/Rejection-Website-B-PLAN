require('dotenv').config();
const mysql = require("mysql2/promise");

// Database configuration with connection pooling
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'job_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Test database connection on startup
(async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    console.log("✅ Successfully connected to the database");
    
    // Verify table exists
    const [rows] = await connection.query(`
      SELECT COUNT(*) AS table_exists 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'job_posts'
    `, [process.env.DB_NAME || 'job_tracker']);
    
    if (rows[0].table_exists === 0) {
      console.error("❌ Error: 'job_posts' table does not exist");
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  } finally {
    if (connection) await connection.release();
  }
})();

module.exports = pool;