import db from './db.js';
import { renderView } from './render.js';

export default async function handler(req, res) {
  try {
    const { method, query: q, url } = req;

    if (method === 'GET') {
      // 1. Profile Page Handling
      if (url.includes('action=profile')) {
        const userid = q.userid;
        if (!userid) return res.status(400).json({ error: "userid is required" });
        const result = await db.query('SELECT * FROM customer WHERE user_id = $1', [userid]);
        return await renderView(res, 'profile', { result: result.rows });
      }

      // 2. Movies Dashboard Handling
      if (url.includes('action=moviesdash')) {
        const result = await db.query('SELECT * FROM movie');
        return await renderView(res, 'moviesdash', { movies: result.rows });
      }

      // 3. Default Landing Page
      return await renderView(res, 'index', { details: [] });
    }

    if (method === 'POST') {
      // 4. Movie Details (Theater & Shows)
      const movieId = q.movieId;
      if (!movieId) return res.status(400).json({ error: "movieId is required" });

      const theaters = await db.query(
        'SELECT t.* FROM theater t JOIN theater1 t1 ON t.theater_id = t1.theater_id WHERE t1.movie_id = $1',
        [movieId]
      );
      const shows = await db.query('SELECT * FROM shows WHERE movie_id = $1', [movieId]);
      return await renderView(res, 'theatersandshow', { 
        info: { result: theaters.rows, shows: shows.rows } 
      });
    }

    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error('Movies API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
