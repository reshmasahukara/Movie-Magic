import bcrypt from 'bcryptjs';
import db from './db.js';
import { renderView } from './render.js';

export default async function handler(req, res) {
  try {
    const { method, body } = req;

    if (method === 'GET') {
      return await renderView(res, 'usersignup');
    }

    if (method === 'POST') {
      const { username: name, email, password, city, contactno } = body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const hashpass = await bcrypt.hash(password, 10);
      
      // Traditional ID generation logic preserved
      const longNumber = parseInt(contactno || "0");
      const shortNumber = longNumber % 1000;
      const shortNumber2 = Math.floor(longNumber / 100000);
      const user_id = shortNumber + shortNumber2;

      const checkUser = await db.query('SELECT user_id FROM customer WHERE user_id = $1 OR email = $2', [user_id, email]);
      if (checkUser.rows.length > 0) {
        return res.status(409).json({ error: "User ID or Email already exists" });
      }

      await db.query(
        'INSERT INTO customer (user_id, name, email, password, city, contact_no) VALUES ($1, $2, $3, $4, $5, $6)',
        [user_id, name, email, hashpass, city, contactno]
      );

      const details = [{ user_id, name, email, city, contact_no: contactno }];
      return await renderView(res, 'index', { details });
    }

    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error('Signup API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
