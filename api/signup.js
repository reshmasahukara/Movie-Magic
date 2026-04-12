import bcrypt from 'bcryptjs';
import { query } from './db.js';

export default async function handler(req, res) {
  try {
    const { method, body } = req;

    if (method === 'POST') {
      const { username: name, email, password, city, contactno, otp } = body;
      
      if (!name || !email || !password || !otp) {
        return res.status(400).json({ error: "Missing required fields (including OTP)" });
      }

      const checkUser = await query('SELECT user_id FROM customer WHERE email = $1', [email]);
      if (checkUser.rows.length > 0) {
        return res.status(409).json({ error: "Email already exists" });
      }

      // 1.5 Secure OTP Verification Check (Requirement: OTP must match AND be verified)
      const isVerified = await query(
        'SELECT id FROM otp_verifications WHERE email = $1 AND otp = $2 AND is_verified = TRUE AND expires_at > NOW()', 
        [email, otp]
      );
      
      if (isVerified.rows.length === 0) {
        return res.status(401).json({ error: "Invalid or unverified OTP Session. Please verify your email first." });
      }

      const hashpass = await bcrypt.hash(password, 10);
      const result = await query(
        'INSERT INTO customer (name, email, password, city, contact_no) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
        [name, email, hashpass, city, contactno]
      );

      const user_id = result.rows[0].user_id;

      // 4. Purge verification record after successful signup
      await query('DELETE FROM otp_verifications WHERE email = $1', [email]);

      return res.status(201).json({ 
        success: true, 
        message: "User registered successfully",
        user: { user_id, name, email } 
      });
    }

    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error('Signup API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
