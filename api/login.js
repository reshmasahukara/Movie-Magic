import bcrypt from 'bcrypt';
import db from '../utils/db.js';
import { renderView } from '../utils/render.js';

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    return await renderView(res, 'userlogin');
  }

  if (method === 'POST') {
    // Check if it's logout (determined by URL or body)
    if (req.url.includes('logout')) {
      res.setHeader('Location', '/admin');
      return res.status(302).end();
    }

    const { email, password } = req.body;
    try {
      const result = await db.query('SELECT * FROM customer WHERE email = $1', [email]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (match) {
          return res.status(200).json({ details: [user] });
        }
        return res.status(401).json("Invalid password");
      }
      return res.status(404).json("User Not Found");
    } catch (error) {
      console.error(error);
      return res.status(500).json("Server Error");
    }
  }

  return res.status(405).send('Method Not Allowed');
}
