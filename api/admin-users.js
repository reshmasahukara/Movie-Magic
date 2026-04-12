import { query } from './lib/db.js';

export default async function handler(req, res) {
  const { method, body } = req;
  
  try {
    if (method === 'GET') {
      const result = await query('SELECT user_id, name, email, city, contact_no, is_blocked FROM customer ORDER BY user_id DESC');
      return res.status(200).json({ success: true, list: result.rows });
    }

    if (method === 'POST') {
      const { action, userId, block } = body;
      if (action === 'toggleBlock') {
        await query('UPDATE customer SET is_blocked = $1 WHERE user_id = $2', [block, userId]);
        return res.status(200).json({ success: true });
      }
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
