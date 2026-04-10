import { query } from './db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  try {
    const { method, body, query: q } = req;

    // 1. Admin Login
    if (method === 'POST' && q.action === 'login') {
      const { username, password } = body;
      const result = await query('SELECT * FROM admin WHERE user_name = $1', [username]);
      if (result.rows.length > 0) {
        const admin = result.rows[0];
        const match = admin.password.startsWith('$2b$') 
          ? await bcrypt.compare(password, admin.password) 
          : (password === admin.password);
        
        if (match) return res.status(200).json({ success: true, admin: { username: admin.user_name } });
      }
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    // 2. Fetch Dashboard Data
    if (method === 'GET' && q.action === 'dash') {
      const customers = await query('SELECT * FROM customer');
      const movies = await query('SELECT * FROM movie');
      const theaters = await query('SELECT * FROM theater');
      const shows = await query('SELECT * FROM shows');
      return res.status(200).json({
        success: true,
        data: {
          customers: customers.rows,
          movies: movies.rows,
          theater: theaters.rows,
          shows: shows.rows
        }
      });
    }

    // 3. CRUD Operations
    if (method === 'POST') {
      const { action } = q;
      if (action === 'addMovie') {
        const { movieId, movieName, movieRating, movieDimensions, movieGenre, movieStatus, movieDescription, movieLanguage, theaterId, Timmings, showdate, screenno, screendimensions, noofseats, selectedseats } = body;
        await query('INSERT INTO movie (movie_id, movie_name, movie_rating, movie_dimensions, genre, status, description, language) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (movie_id) DO NOTHING', [movieId, movieName, movieRating, movieDimensions, movieGenre, movieStatus, movieDescription, movieLanguage]);
        await query('INSERT INTO theater1 (theater_id, movie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [theaterId, movieId]);
        await query('INSERT INTO shows (movie_id, theater_id, timmings, show_date, screen_no, screen_dimensions, no_of_seats, selected_seats) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [movieId, theaterId, Timmings, showdate, screenno, screendimensions, noofseats, JSON.parse(JSON.stringify(selectedseats || '[]'))]);
        return res.status(200).json({ success: true, message: "Movie added" });
      }

      if (action === 'removeMovie') {
        const { movieId, theaterId, showId } = body;
        if (showId) await query('DELETE FROM shows WHERE screen_id = $1', [showId]);
        return res.status(200).json({ success: true, message: "Movie removed" });
      }

      if (action === 'removeCustomer') {
        const { customeremail } = body;
        await query('DELETE FROM customer WHERE email = $1', [customeremail]);
        return res.status(200).json({ success: true, message: "Customer removed" });
      }
    }

    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error('Admin API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
