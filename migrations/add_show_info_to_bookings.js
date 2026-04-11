import { query } from '../api/db.js';

async function migrate() {
  console.log('--- Migration: Adding show context to bookings table ---');
  try {
    // Add columns if they don't exist
    await query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS movie_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS show_date DATE,
      ADD COLUMN IF NOT EXISTS show_time TIME
    `);
    
    // Backfill movie_id from shows table
    await query(`
      UPDATE bookings b
      SET movie_id = s.movie_id,
          show_date = s.show_date,
          show_time = s.timmings
      FROM shows s
      WHERE b.screen_id = s.screen_id
      AND b.movie_id IS NULL
    `);

    console.log('SUCCESS: movie_id, show_date, and show_time columns added to bookings');
  } catch (err) {
    console.error('FAILED: Migration error:', err.message);
  }
}

migrate();
