import { query } from './lib/db.js';

export default async function handler(req, res) {
  const { method, query: q, body } = req;
  const action = q.action;

  try {
    if (method === 'GET') {
      // 1. Fetch All Movies / Filtered
      if (action === 'list') {
        const { status, genre } = q;
        let sql = 'SELECT * FROM movie';
        let params = [];

        if (status && status !== 'all') {
          sql += ' WHERE show_status = $1';
          params.push(status);
        }

        sql += ' ORDER BY release_date DESC';
        const result = await query(sql, params);
        return res.status(200).json({ success: true, movies: result.rows });
      }

      // 2. Single Movie Details
      if (action === 'get' && q.id) {
        const result = await query('SELECT * FROM movie WHERE movie_id = $1', [q.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Movie not found' });
        return res.status(200).json({ success: true, movie: result.rows[0] });
      }
      
      // 3. Featured Movies for Homepage
      if (action === 'featured') {
        const result = await query("SELECT * FROM movie WHERE show_status = 'Now Showing' LIMIT 10");
        return res.status(200).json({ success: true, movies: result.rows });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Movies API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
