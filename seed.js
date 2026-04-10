import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function seed() {
  if (!connectionString) {
    console.error('DATABASE_URL is missing. Please set it in .env');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Starting Standalone Seed Process...');

    // 1. Clear existing data
    await pool.query('TRUNCATE customer, movie, theater, shows, bookings, payments CASCADE');
    console.log('Tables truncated.');

    // 2. Seed Movies
    const movies = [
      ['M001', 'RAAKA', '9.2', 'IMAX 3D', 'Action/Thriller', 'Coming Soon', 'A high-octane action epic.', 'Telugu/Hindi'],
      ['M002', 'OG', '9.5', '2D/4DX', 'Gangster Drama', 'Running', 'The original gangster returns to reclaim his throne.', 'Telugu'],
      ['M003', 'SPIRIT', '9.0', '2D', 'Crime/Action', 'In Production', 'A gripping police procedural drama.', 'Multi-Language'],
      ['M004', 'VARANASI', '8.8', 'Standard', 'Spiritual/Drama', 'Now Showing', 'A journey of self-discovery in the holy city.', 'Hindi']
    ];

    for (const m of movies) {
      await pool.query(
        'INSERT INTO movie (movie_id, movie_name, movie_rating, movie_dimensions, genre, status, description, language) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        m
      );
    }
    console.log('Movies seeded.');

    // 3. Seed Professional Theaters
    const theaters = [
      ['Cinepolis Nexus', 'Hyderabad'],
      ['INOX: DN Regalia Mall', 'Hyderabad'],
      ['INOX: Symphony Mall', 'Hyderabad'],
      ['PVR: Utkal Kanika Galleria', 'Hyderabad'],
      ['PJ Movies (Veena Theatre)', 'Hyderabad']
    ];

    const theaterIds = [];
    for (const t of theaters) {
      const res = await pool.query('INSERT INTO theater (theater_name, city) VALUES ($1, $2) RETURNING theater_id', t);
      theaterIds.push(res.rows[0].theater_id);
    }
    console.log('Theaters seeded.');

    // 4. Seed Shows (Multiple dates and times)
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 5; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }

    const times = ['10:15:00', '13:30:00', '18:05:00', '21:15:00'];
    const dimensions = ['2D', '3D', 'IMAX 3D', '4DX'];

    for (const tId of theaterIds) {
      for (const m of movies) {
        // Randomly assign movies to theaters
        if (Math.random() > 0.3) {
          for (const date of dates) {
            for (const time of times) {
                await pool.query(
                    'INSERT INTO shows (movie_id, theater_id, timmings, show_date, screen_no, screen_dimensions, no_of_seats) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [m[0], tId, time, date, Math.floor(Math.random() * 5 + 1), dimensions[Math.floor(Math.random() * dimensions.length)], 100]
                );
            }
          }
        }
      }
    }
    console.log('Show schedules generated.');

    // 5. Seed Admin
    await pool.query('INSERT INTO admin (user_name, password) VALUES ($1, $2) ON CONFLICT DO NOTHING', ['admin', '$2b$10$Ex7a3U/6v6k.6hMv3I5BieH2h9lF5Y.Uu/K8b6VjJvUuJ/v8v5q/m']);
    
    console.log('Seed Completed Successfully! 🍿');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Seed Failed:', error);
    await pool.end();
    process.exit(1);
  }
}

seed();
