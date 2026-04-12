import bcrypt from 'bcryptjs';
import { query } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username: name, email, password, city, contactno, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ error: "All fields including OTP are required" });
    }

    // 1. ATOMIC OTP VERIFICATION
    const checkOtp = await query(
      'SELECT id FROM otp_verifications WHERE email = $1 AND otp = $2 AND expires_at > NOW()',
      [email, otp]
    );

    if (checkOtp.rows.length === 0) {
      return res.status(401).json({ error: "Invalid or expired OTP. Please request a new one." });
    }

    // 2. CHECK IF USER ALREADY EXISTS (Final check)
    const checkUser = await query('SELECT user_id FROM customer WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(409).json({ error: "Email already exists" });
    }

    // 3. HASH AND INSERT
    const hashpass = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO customer (name, email, password, city, contact_no) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
      [name, email, hashpass, city, contactno]
    );

    // 4. CLEANUP OTP
    await query('DELETE FROM otp_verifications WHERE email = $1', [email]);

    return res.status(201).json({
      success: true,
      message: "Registration successful!",
      user: { user_id: result.rows[0].user_id, name, email }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: 'Server error during registration: ' + error.message });
  }
}
