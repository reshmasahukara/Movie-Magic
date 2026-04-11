import { query } from '../api/db.js';

async function migrate() {
  console.log('--- Migration: Adding theater info to bookings table ---');
  try {
    // Add columns if they don't exist
    await query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS theater_id INTEGER,
      ADD COLUMN IF NOT EXISTS theater_name VARCHAR(255)
    `);
    
    // Backfill existing bookings for consistency (Best effort)
    await query(`
      UPDATE bookings b
      SET theater_name = t.theater_name,
          theater_id = t.theater_id
      FROM shows s
      JOIN theater t ON s.theater_id = t.theater_id
      WHERE b.screen_id = s.screen_id
      AND b.theater_name IS NULL
    `);

    console.log('SUCCESS: theater_id and theater_name columns added to bookings');
  } catch (err) {
    console.error('FAILED: Migration error:', err.message);
  }
}

migrate();
