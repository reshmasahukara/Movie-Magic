import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

/**
 * Neon PostgreSQL Connection Configuration
 */
const connectionString = process.env.DATABASE_URL;

let pool;

try {
  if (connectionString) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10, // Optimized for serverless
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
} catch (error) {
  console.error('Failed to initialize DB Pool:', error);
}

export const query = async (text, params) => {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured in environment variables.');
  }
  if (!pool) {
    throw new Error('Database connection pool failed to initialize.');
  }
  return pool.query(text, params);
};

// Fallback handler if api/db is hit directly
export default async function handler(req, res) {
  res.status(200).json({ 
    message: "Database Utility Active",
    connectionConfigured: !!connectionString,
    nodeEnv: process.env.NODE_ENV
  });
}

export { pool };
