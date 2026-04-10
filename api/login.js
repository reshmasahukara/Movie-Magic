import bcrypt from 'bcryptjs';
import db from './db.js';

export default async function handler(req, res) {
  try {
    const { method } = req;

    if (method === 'POST') {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const result = await db.query('SELECT * FROM customer WHERE email = $1', [email]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (match) {
          // Sensitive: remove password before sending
          const { password: _, ...userData } = user;
          return res.status(200).json({ success: true, user: userData });
        }
        return res.status(401).json({ error: "Invalid password" });
      }
      return res.status(404).json({ error: "User Not Found" });
    }

    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error('Login API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
