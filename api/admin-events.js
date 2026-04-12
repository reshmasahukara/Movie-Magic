import { query } from './lib/db.js';

export default async function handler(req, res) {
  const { method, body, query: q } = req;
  
  try {
    if (method === 'GET') {
      const result = await query('SELECT * FROM events ORDER BY id DESC');
      return res.status(200).json({ success: true, list: result.rows });
    }

    if (method === 'POST') {
      const { action, data } = body;
      if (action === 'delete') {
        await query('DELETE FROM events WHERE id = $1', [data.id]);
        return res.status(200).json({ success: true });
      }
      if (action === 'add') {
        const { name, category, city, venue, date, time, price, image_url, seats } = data;
        const resu = await query(
          'INSERT INTO events (event_name, category, city, venue, event_date, event_time, price, image_url, total_seats, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
          [name, category, city, venue, date, time, price, image_url, seats || 1000, 'Active']
        );
        return res.status(201).json({ success: true, id: resu.rows[0].id });
      }
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
