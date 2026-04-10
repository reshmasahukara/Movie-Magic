import db from '../utils/db.js';
import bcrypt from 'bcrypt';
import { renderView } from '../utils/render.js';

export default async function handler(req, res) {
  const { method, url, body } = req;

  // 1. Admin Login Page
  if (method === 'GET' && url.includes('admin') && !url.includes('dash')) {
    return await renderView(res, 'admin');
  }

  // 2. Admin Login Logic
  if (method === 'POST' && url.includes('admin') && !url.includes('dash')) {
    const { username, password } = body;
    try {
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
      return res.status(401).send({ error: "Invalid admin credentials" });
    } catch (error) {
      return res.status(500).send("Login error");
    }
  }

  // 3. Admin Dashboard
  if (method === 'GET' && (url.includes('dash') || url.includes('action=dash'))) {
    try {
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
    } catch (error) {
      return res.status(500).send("Dashboard error");
    }
  }

  // 4. Add Movie
  if (method === 'POST' && url.includes('addMovie')) {
    const { movieId, movieName, movieRating, movieDimensions, movieGenre, movieStatus, movieDescription, movieLanguage, theaterId, Timmings, showdate, screenno, screendimensions, noofseats, selectedseats } = body;
    try {
      const checkMovie = await db.query('SELECT * FROM movie WHERE movie_id = $1', [movieId]);
      if (checkMovie.rows.length === 0) {
        await db.query(
          'INSERT INTO movie (movie_id, movie_name, movie_rating, movie_dimensions, genre, status, description, language) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [movieId, movieName, movieRating, movieDimensions, movieGenre, movieStatus, movieDescription, movieLanguage]
        );
      }
      const checkLink = await db.query('SELECT * FROM theater1 WHERE theater_id = $1 AND movie_id = $2', [theaterId, movieId]);
      if (checkLink.rows.length === 0) {
        await db.query('INSERT INTO theater1 (theater_id, movie_id) VALUES ($1, $2)', [theaterId, movieId]);
      }
      await db.query(
        'INSERT INTO shows (movie_id, theater_id, timmings, show_date, screen_no, screen_dimensions, no_of_seats, selected_seats) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [movieId, theaterId, Timmings, showdate, screenno, screendimensions, noofseats, JSON.parse(JSON.stringify(selectedseats || '[]'))]
      );
      res.setHeader('Location', '/api/admin?action=dash');
      return res.status(302).end();
    } catch (error) {
      return res.status(500).send("Add movie error");
    }
  }

  // 5. Remove Movie
  if (method === 'POST' && url.includes('removeMovie')) {
    const { movieId, theaterId, showId } = body;
    try {
      await db.query('DELETE FROM shows WHERE screen_id = $1', [showId]);
      await db.query('DELETE FROM theater1 WHERE movie_id = $1 AND theater_id = $2', [movieId, theaterId]);
      await db.query('DELETE FROM movie WHERE movie_id = $1', [movieId]);
      res.setHeader('Location', '/api/admin?action=dash');
      return res.status(302).end();
    } catch (error) {
      return res.status(500).send("Remove movie error");
    }
  }

  // 6. Remove Customer
  if (method === 'POST' && url.includes('removeCustomer')) {
    const { customeremail } = body;
    try {
      await db.query('DELETE FROM customer WHERE email = $1', [customeremail]);
      res.setHeader('Location', '/api/admin?action=dash');
      return res.status(302).end();
    } catch (error) {
      return res.status(500).send("Remove customer error");
    }
  }

  return res.status(405).send('Method Not Allowed');
}
