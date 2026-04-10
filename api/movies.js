import db from '../utils/db.js';
import { renderView } from '../utils/render.js';

export default async function handler(req, res) {
  const { method, query, url } = req;

  if (method === 'GET') {
    // 1. Profile Page
    if (url.includes('profile')) {
      const { userid } = query;
      try {
        const result = await db.query('SELECT * FROM customer WHERE user_id = $1', [userid]);
        return await renderView(res, 'profile', { result: result.rows });
      } catch (error) {
        return res.status(500).send("Profile error");
      }
    }

    // 2. Movies Dashboard
    if (url.includes('moviesdash')) {
      try {
        const result = await db.query('SELECT * FROM movie');
        return await renderView(res, 'moviesdash', { movies: result.rows });
      } catch (error) {
        return res.status(500).send("Movies error");
      }
    }

    // 3. Landing Page (Home)
    return await renderView(res, 'index', { details: [] });
  }

  if (method === 'POST') {
    // 4. Movie Details (Theater & Shows) - triggered by Book Now in moviesdash
    const { movieId } = query;
    try {
      const theaters = await db.query(
        'SELECT t.* FROM theater t JOIN theater1 t1 ON t.theater_id = t1.theater_id WHERE t1.movie_id = $1',
        [movieId]
      );
      const shows = await db.query('SELECT * FROM shows WHERE movie_id = $1', [movieId]);
      return await renderView(res, 'theatersandshow', { info: { result: theaters.rows, shows: shows.rows } });
    } catch (error) {
      return res.status(500).send("Movie detail error");
    }
  }

  return res.status(405).send('Method Not Allowed');
}
