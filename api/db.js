import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

/**
 * Neon PostgreSQL Connection Configuration
 * - connectionString: From process.env.DATABASE_URL
 * - ssl: Required for Neon from Vercel/external environments
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('CRITICAL: DATABASE_URL environment variable is missing.');
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const query = async (text, params) => {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured in environment variables.');
  }
  return pool.query(text, params);
};

// Fallback handler if api/db is hit directly
export default async function handler(req, res) {
  res.status(200).json({ message: "Database Utility Active" });
}

export { pool };
