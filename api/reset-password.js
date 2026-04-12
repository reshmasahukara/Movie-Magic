import bcrypt from 'bcryptjs';
import { query } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.status(400).json({ error: 'Missing required data' });
  }

  try {
    // 1. Double check verification status for safety
    const isVerified = await query(
      'SELECT id FROM otp_verifications WHERE email = $1 AND otp = $2 AND is_verified = TRUE AND expires_at > NOW()',
      [email, otp]
    );

    if (isVerified.rows.length === 0) {
      return res.status(401).json({ error: 'Verification required. Please re-enter OTP.' });
    }

    // 2. Hash and update password
    const hashpass = await bcrypt.hash(password, 10);
    await query('UPDATE customer SET password = $1 WHERE email = $2', [hashpass, email]);

    // 3. Cleanup
    await query('DELETE FROM otp_verifications WHERE email = $1', [email]);

    return res.status(200).json({ success: true, message: 'Password updated successfully' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
