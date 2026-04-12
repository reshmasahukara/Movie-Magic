import { query } from './lib/db.js';

export default async function handler(req, res) {
  const { method, body, query: q } = req;
  
  try {
    if (method === 'GET') {
      const result = await query('SELECT * FROM movie ORDER BY movie_id DESC');
      return res.status(200).json({ success: true, list: result.rows });
    }

    if (method === 'POST') {
      const { action, data } = body;
      if (action === 'delete') {
        await query('DELETE FROM movie WHERE movie_id = $1', [data.id]);
        return res.status(200).json({ success: true });
      }
      if (action === 'add') {
        const { name, genre, duration, language, release_date, poster_url, status } = data;
        const resu = await query(
          'INSERT INTO movie (movie_name, genre, duration, language, release_date, poster_url, show_status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING movie_id',
          [name, genre, duration, language, release_date, poster_url, status]
        );
        return res.status(201).json({ success: true, id: resu.rows[0].movie_id });
      }
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
