import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

let pool;

try {
  if (connectionString) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
} catch (error) {
  console.error('Failed to initialize DB Pool:', error);
}

export const query = async (text, params) => {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.');
  }
  if (!pool) {
    throw new Error('Database connection pool failed.');
  }
  return pool.query(text, params);
};

export { pool };
