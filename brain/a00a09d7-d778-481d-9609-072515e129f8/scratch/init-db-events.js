import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function init() {
  console.log('--- Initializing Event System Database ---');
  
  try {
    // 1. Create Events Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        event_name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        city VARCHAR(100) NOT NULL,
        venue VARCHAR(255) NOT NULL,
        event_date DATE NOT NULL,
        event_time VARCHAR(20) NOT NULL,
        price INTEGER NOT NULL,
        total_seats INTEGER NOT NULL,
        booked_seats JSONB DEFAULT '[]',
        image_url TEXT,
        description TEXT,
        status VARCHAR(20) DEFAULT 'Active',
        has_seat_map BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ events table created');

    // 2. Create Event Bookings Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_bookings (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id),
        user_id INTEGER NOT NULL,
        user_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(20),
        tickets_count INTEGER NOT NULL,
        selected_seats TEXT[], 
        amount INTEGER NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'Paid',
        booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ event_bookings table created');

    // 3. Seed Sample Data
    const check = await pool.query('SELECT count(*) FROM events');
    if (parseInt(check.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO events (event_name, category, city, venue, event_date, event_time, price, total_seats, image_url, description, has_seat_map)
        VALUES 
        ('Sunburn Home Festival', 'Music', 'Kochi', 'Digital Event', '2026-04-20', '07:00 PM', 499, 1000, 
         'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200', 
         'India Largest EDM festival is coming to your home screen! Experience the magic of Sunburn from anywhere.', FALSE),
        
        ('Live Jazz Night', 'Music', 'Bengaluru', 'The Blue Door', '2026-04-25', '08:30 PM', 799, 60, 
         'https://www.shutterstock.com/image-vector/live-music-jazz-night-neon-260nw-1891078309.jpg', 
         'An intimate evening of soothing jazz and world-class cocktails at the heart of Indiranagar.', TRUE),
        
        ('Camping in Pawna', 'Outdoor', 'Pune', 'Pawna Lake', '2026-04-18', '11:00 AM', 1200, 40, 
         'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200', 
         'A serene escape by the lakeside with bonfire, music, and BBQ under the stars.', FALSE),

        ('EDM Pulse 2026', 'Music', 'Mumbai', 'MMRDA Grounds', '2026-05-02', '06:00 PM', 1499, 5000, 
         'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200', 
         'The biggest EDM concert of the summer featuring global headliners and breathtaking stage production.', FALSE)
      `);
      console.log('✓ Seed events inserted');
    }

    console.log('--- Database Setup Complete ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database Initialization Failed:', err);
    process.exit(1);
  }
}

init();
