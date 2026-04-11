import { query } from '../api/db.js';

async function migrate() {
  console.log('--- Migration: Creating booked_seats table ---');
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS booked_seats (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        screen_id VARCHAR(255) REFERENCES shows(screen_id) ON DELETE CASCADE,
        seat_number VARCHAR(50) NOT NULL,
        UNIQUE(screen_id, seat_number)
      )
    `);
    console.log('SUCCESS: booked_seats table created with UNIQUE constraint on (screen_id, seat_number)');
  } catch (err) {
    console.error('FAILED: Migration error:', err.message);
  }
}

migrate();
