import { query } from './db.js';

export default async function handler(req, res) {
  const { method, query: q } = req;

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const showId = q.id;
  if (!showId) {
    return res.status(400).json({ error: 'Show ID is required' });
  }

  try {
    // Fetch show and join with theater/movie for complete context
    const result = await query(
      `SELECT s.*, t.theater_name, t.location, m.movie_name 
       FROM shows s 
       JOIN theater t ON s.theater_id = t.theater_id 
       JOIN movie m ON s.movie_id = m.movie_id 
       WHERE s.screen_id = $1`,
      [showId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Show not found' });
    }

    return res.status(200).json({
      success: true,
      show: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching show:', error);
    return res.status(500).json({ error: error.message });
  }
}
