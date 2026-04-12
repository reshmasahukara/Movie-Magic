import { query } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, otp } = req.body;

  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  try {
    const check = await query(
      'SELECT id FROM otp_verifications WHERE email = $1 AND otp = $2 AND expires_at > NOW()',
      [email, otp]
    );

    if (check.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Mark as verified for the next step
    await query('UPDATE otp_verifications SET is_verified = TRUE WHERE email = $1 AND otp = $2', [email, otp]);

    return res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
