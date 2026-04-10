import bcrypt from 'bcrypt';
import db from '../utils/db.js';
import { renderView } from '../utils/render.js';

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    return await renderView(res, 'usersignup');
  }

  if (method === 'POST') {
    const { username: name, email, password, city, contactno } = req.body;
    try {
      const rounds = 10;
      const hashpass = await bcrypt.hash(password, rounds);
      
      const longNumber = parseInt(contactno);
      const shortNumber = longNumber % 1000;
      const shortNumber2 = Math.floor(longNumber / 100000);
      const user_id = shortNumber + shortNumber2;

      const checkUser = await db.query('SELECT user_id FROM customer WHERE user_id = $1 OR email = $2', [user_id, email]);
      if (checkUser.rows.length > 0) {
        return res.status(400).send({ error: "User ID or Email already exists" });
      }

      await db.query(
        'INSERT INTO customer (user_id, name, email, password, city, contact_no) VALUES ($1, $2, $3, $4, $5, $6)',
        [user_id, name, email, hashpass, city, contactno]
      );

      const details = [{ user_id, name, email, city, contact_no: contactno }];
      return await renderView(res, 'index', { details });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ error: "Signup error" });
    }
  }

  return res.status(405).send('Method Not Allowed');
}
