import { query } from './lib/db.js';

export default async function handler(req, res) {
  const { method, query: q } = req;
  const action = q.action;

  try {
    if (method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (action === 'profile') {
      const { userid } = q;
      if (!userid) return res.status(400).json({ error: "userid required" });
      const result = await query('SELECT * FROM customer WHERE user_id = $1', [userid]);
      return res.status(200).json({ success: true, user: result.rows[0] });
    }

    if (action === 'history') {
      const { userid } = q;
      if (!userid) return res.status(400).json({ error: "userid required" });
      const result = await query(
        `SELECT b.*, m.movie_name, COALESCE(b.show_time, s.timmings) AS timmings, TO_CHAR(COALESCE(b.show_date, s.show_date), 'YYYY-MM-DD') AS show_date
         FROM bookings b 
         LEFT JOIN movie m ON b.movie_id = m.movie_id 
         LEFT JOIN shows s ON b.screen_id = s.screen_id
         WHERE b.user_id = $1 
         ORDER BY b.created_at DESC`,
        [userid]
      );
      return res.status(200).json({ success: true, bookings: result.rows });
    }

    return res.status(400).json({ error: 'Invalid user action' });
  } catch (error) {
    console.error('User Domain Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
