import db from './db.js';
import bcrypt from 'bcryptjs';
import { renderView } from './render.js';

export default async function handler(req, res) {
  try {
    const { method, url, body, query: q } = req;

    // 1. Admin Login Page
    if (method === 'GET' && url.includes('admin') && !url.includes('dash')) {
      return await renderView(res, 'admin');
    }

    // 2. Admin Login Logic
    if (method === 'POST' && url.includes('admin') && !url.includes('dash')) {
      const { username, password } = body;
      if (!username || !password) return res.status(400).json({ error: "Missing credentials" });
      
      const result = await db.query('SELECT * FROM admin WHERE user_name = $1', [username]);
      if (result.rows.length > 0) {
        const admin = result.rows[0];
        let match = false;
        if (admin.password.startsWith('$2b$')) {
          match = await bcrypt.compare(password, admin.password);
        } else {
          match = (password === admin.password);
        }
        if (match) {
          res.setHeader('Location', '/api/admin?action=dash');
          return res.status(302).end();
        }
      }
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    // 3. Admin Dashboard
    if (method === 'GET' && (url.includes('dash') || q.action === 'dash')) {
      const customers = await db.query('SELECT * FROM customer');
      const movies = await db.query('SELECT * FROM movie');
      const theaters = await db.query('SELECT * FROM theater');
      const shows = await db.query('SELECT * FROM shows');
      return await renderView(res, 'admindash', {
        details: {
          customers: customers.rows,
          movies: movies.rows,
          theater: theaters.rows,
          shows: shows.rows
        }
      });
    }

    // 4. CRUD: Add Movie
    if (method === 'POST' && url.includes('addMovie')) {
      const { movieId, movieName, movieRating, movieDimensions, movieGenre, movieStatus, movieDescription, movieLanguage, theaterId, Timmings, showdate, screenno, screendimensions, noofseats, selectedseats } = body;
      
      await db.query(
        'INSERT INTO movie (movie_id, movie_name, movie_rating, movie_dimensions, genre, status, description, language) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (movie_id) DO NOTHING',
        [movieId, movieName, movieRating, movieDimensions, movieGenre, movieStatus, movieDescription, movieLanguage]
      );
      
      await db.query(
        'INSERT INTO theater1 (theater_id, movie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [theaterId, movieId]
      );

      await db.query(
        'INSERT INTO shows (movie_id, theater_id, timmings, show_date, screen_no, screen_dimensions, no_of_seats, selected_seats) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [movieId, theaterId, Timmings, showdate, screenno, screendimensions, noofseats, JSON.parse(JSON.stringify(selectedseats || '[]'))]
      );
      
      res.setHeader('Location', '/api/admin?action=dash');
      return res.status(302).end();
    }

    // 5. CRUD: Remove Movie
    if (method === 'POST' && url.includes('removeMovie')) {
      const { movieId, theaterId, showId } = body;
      if (showId) await db.query('DELETE FROM shows WHERE screen_id = $1', [showId]);
      res.setHeader('Location', '/api/admin?action=dash');
      return res.status(302).end();
    }

    // 6. CRUD: Remove Customer
    if (method === 'POST' && url.includes('removeCustomer')) {
      const { customeremail } = body;
      await db.query('DELETE FROM customer WHERE email = $1', [customeremail]);
      res.setHeader('Location', '/api/admin?action=dash');
      return res.status(302).end();
    }

    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error('Admin API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
