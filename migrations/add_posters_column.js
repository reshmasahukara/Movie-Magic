import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function migrate() {
  if (!connectionString) {
    console.error('DATABASE_URL is missing.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Running Migration: Add poster_url to movie table...');
    await pool.query('ALTER TABLE movie ADD COLUMN IF NOT EXISTS poster_url VARCHAR(500);');
    console.log('Migration Completed Successfully!');
    await pool.end();
  } catch (error) {
    console.error('Migration Failed:', error);
    await pool.end();
    process.exit(1);
  }
}

migrate();
