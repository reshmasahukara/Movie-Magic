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
    await pool.query('TRUNCATE customer, movie, theater, shows, bookings, payments RESTART IDENTITY CASCADE');
    await pool.query('ALTER SEQUENCE shows_screen_id_seq RESTART WITH 1000');
    console.log('Tables truncated.');

    // 2. Seed Movies
    const movies = [
      ['M001', 'RAAKA', '9.2', 'IMAX 3D', 'Action/Thriller', 'Coming Soon', 'A high-octane action epic.', 'Telugu/Hindi'],
      ['M002', 'OG', '9.5', '2D/4DX', 'Gangster Drama', 'Running', 'The original gangster returns to reclaim his throne.', 'Telugu'],
      ['M003', 'SPIRIT', '9.0', '2D', 'Crime/Action', 'In Production', 'A gripping police procedural drama.', 'Multi-Language'],
      ['M004', 'VARANASI', '8.8', 'Standard', 'Spiritual/Drama', 'Now Showing', 'A journey of self-discovery in the holy city.', 'Hindi'],
      ['M005', 'DRAGON', '8.5', '3D', 'Fantasy/Action', 'Coming Soon', 'A tale of fire and blood.', 'English'],
      ['M006', 'PUSHPA THE RULE', '9.8', 'IMAX 2D', 'Action/Drama', 'Running', 'The rule of Pushpa begins.', 'Telugu/Hindi'],
      ['M007', 'BAHUBALI 2', '9.9', 'IMAX 4K', 'Epic/Action', 'Running', 'The conclusion to the epic saga.', 'Telugu/Hindi'],
      ['M008', 'STRANGER THINGS S5', '9.7', 'Standard', 'Sci-Fi/Horror', 'Coming Soon', 'The final chapter in Hawkins.', 'English'],
      ['M009', 'AVENGERS END GAME', '9.6', 'IMAX 3D', 'Superhero', 'Running', 'The grand finale of the infinity saga.', 'English']
    ];

    for (const m of movies) {
      await pool.query(
        'INSERT INTO movie (movie_id, movie_name, movie_rating, movie_dimensions, genre, status, description, language) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT(movie_id) DO UPDATE SET movie_name=EXCLUDED.movie_name',
        m
      );
    }
    console.log('Movies seeded.');

    // 3. Seed Professional Theaters
    const theaters = [
      ['Cinepolis Nexus', 'Hyderabad'],
      ['INOX GVK', 'Hyderabad'],
      ['PVR Forum', 'Hyderabad'],
      ['Cinepolis Ahmedabad One', 'Ahmedabad'],
      ['PVR Acropolis', 'Ahmedabad'],
      ['INOX Himalaya Mall', 'Ahmedabad'],
      ['PVR Phoenix', 'Mumbai'],
      ['Cinepolis Andheri', 'Mumbai'],
      ['INOX Nariman Point', 'Mumbai'],
      ['Cinepolis Nexus Esplanade', 'Bhubaneswar'],
      ['INOX DN Regalia', 'Bhubaneswar'],
      ['PVR Utkal Kanika', 'Bhubaneswar'],
      ['PVR Select Citywalk', 'Delhi'],
      ['INOX Garuda Mall', 'Bengaluru'],
      ['Cinepolis Seasons', 'Pune'],
      ['PVR Express Avenue', 'Chennai'],
      ['INOX Forum Mall', 'Kolkata'],
      ['PVR Lulu Mall', 'Kochi']
    ];

    const theaterIds = [];
    for (const t of theaters) {
      const res = await pool.query('INSERT INTO theater (theater_name, city) VALUES ($1, $2) RETURNING theater_id', t);
      theaterIds.push(res.rows[0].theater_id);
    }
    console.log('Theaters seeded.');

    // 4. Seed Shows (Multiple dates and times)
    console.log('Generating show schedules and manual mock entries...');
    
    // 4.1 Force-Seed Mock IDs for Selection Hub Stability
    const mockShows = [
      ['M001', theaterIds[0], '10:15:00', new Date().toISOString().split('T')[0], 1, 'IMAX 3D', 101],
      ['M001', theaterIds[0], '18:05:00', new Date().toISOString().split('T')[0], 1, '3D', 102],
      ['M001', theaterIds[1], '10:45:00', new Date().toISOString().split('T')[0], 2, '2D', 201],
      ['M001', theaterIds[1], '19:40:00', new Date().toISOString().split('T')[0], 2, '3D', 202],
      ['M001', theaterIds[2], '16:00:00', new Date().toISOString().split('T')[0], 3, '2D', 301],
      ['M001', theaterIds[3], '13:15:00', new Date().toISOString().split('T')[0], 4, '2D', 401],
      ['M001', theaterIds[4], '18:00:00', new Date().toISOString().split('T')[0], 5, '2D', 501]
    ];

    for (const s of mockShows) {
        await pool.query(
            'INSERT INTO shows (movie_id, theater_id, timmings, show_date, screen_no, screen_dimensions, screen_id) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (screen_id) DO NOTHING',
            s
        );
    }

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
