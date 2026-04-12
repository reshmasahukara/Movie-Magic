import { query } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, otp } = req.body;
  
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  try {
    // 1. Check if OTP is valid and not expired
    const checkOtp = await query(
      'SELECT otp, expires_at FROM otp_verifications WHERE email = $1 AND otp = $2', 
      [email, otp]
    );

    if (checkOtp.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    const verification = checkOtp.rows[0];
    const expiresAt = new Date(verification.expires_at);
    
    // 2. Check if expired
    if (expiresAt < new Date()) {
      return res.status(410).json({ error: 'OTP has expired' });
    }

    // 3. Mark as verified (we don't delete yet so signup API can check it)
    await query('UPDATE otp_verifications SET is_verified = TRUE WHERE email = $1 AND otp = $2', [email, otp]);
    
    return res.status(200).json({ success: true, message: 'Email verified successfully' });

  } catch (error) {
    console.error('OTP Verify API Error:', error);
    return res.status(500).json({ error: 'Verification failed: ' + error.message });
  }
}
