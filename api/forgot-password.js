import nodemailer from 'nodemailer';
import { query } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    // 1. Check if email exists
    const userExist = await query('SELECT user_id FROM customer WHERE email = $1', [email]);
    if (userExist.rows.length === 0) {
      return res.status(404).json({ error: 'Email address not registered' });
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    // 3. Store in otp_verifications (Resetting verified status)
    await query('DELETE FROM otp_verifications WHERE email = $1', [email]);
    await query('INSERT INTO otp_verifications (email, otp, expires_at, is_verified) VALUES ($1, $2, $3, FALSE)', [email, otp, expiresAt]);

    // 4. Send Email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: '"Movie Magic 🎬" <moviemagic1911@gmail.com>',
      to: email,
      subject: 'Movie Magic Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0f0f0f; color: white; padding: 40px; border-radius: 12px; text-align: center;">
          <h2 style="color: #e50914;">Password Reset Request 🎬</h2>
          <p style="font-size: 1.1rem; color: #b3b3b3;">Your OTP for resetting your Movie Magic password is:</p>
          <div style="background: #1a1a1a; padding: 20px; border: 1px dashed #e50914; border-radius: 8px; display: inline-block; margin: 20px 0;">
            <p style="font-size: 2.5rem; letter-spacing: 10px; font-weight: 800; color: #ffffff; margin: 0;">${otp}</p>
          </div>
          <p style="font-size: 0.9rem; color: #666;">This code is valid for <strong>5 minutes</strong>. If you did not request this, please secure your account.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: 'OTP sent successfully' });

  } catch (err) {
    console.error('Forgot Password API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
