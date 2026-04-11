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
    console.log('Starting Migration: Altering screen_id from INTEGER to VARCHAR...');

    // 1. Drop Foreign Key from Bookings
    console.log('Dropping foreign key constraints...');
    await pool.query('ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_screen_id_fkey');

    // 2. Alter shows.screen_id
    // First, remove the serial default
    console.log('Altering shows table...');
    await pool.query('ALTER TABLE shows ALTER COLUMN screen_id DROP DEFAULT');
    // Change type to VARCHAR
    await pool.query('ALTER TABLE shows ALTER COLUMN screen_id TYPE VARCHAR(255)');
    
    // 3. Alter bookings.screen_id
    console.log('Altering bookings table...');
    await pool.query('ALTER TABLE bookings ALTER COLUMN screen_id TYPE VARCHAR(255)');

    // 4. Re-add Foreign Key
    console.log('Restoring foreign key constraints...');
    await pool.query('ALTER TABLE bookings ADD CONSTRAINT bookings_screen_id_fkey FOREIGN KEY (screen_id) REFERENCES shows(screen_id) ON DELETE CASCADE');

    console.log('Migration Completed Successfully! screen_id is now VARCHAR(255). 🚀');
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration Failed:', err);
    await pool.end();
    process.exit(1);
  }
}

migrate();
