import nodemailer from 'nodemailer';
import { query } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Environment Check
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return res.status(500).json({ error: 'Server configuration error: Email credentials missing in environment variables. Please add EMAIL_USER and EMAIL_PASS to Vercel.' });
  }

  try {
    // 1. Check if user already exists
    const checkUser = await query('SELECT user_id FROM customer WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) return res.status(400).json({ error: 'Email already registered' });

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    // 3. Clear existing OTPs for this email and store new one
    await query('DELETE FROM otp_verifications WHERE email = $1', [email]);
    await query('INSERT INTO otp_verifications (email, otp, expires_at) VALUES ($1, $2, $3)', [email, otp, expiresAt]);

    // 4. Transport Setup (Using custom credentials)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // 5. Build and Send Email
    const mailOptions = {
      from: '"Movie Magic 🎬" <moviemagic1911@gmail.com>',
      to: email,
      subject: 'Movie Magic Email Verification OTP',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; background-color: #0c0c0c; color: white; padding: 40px; border-radius: 12px; text-align: center; border: 1px solid #333;">
          <h2 style="color: #e50914; font-size: 24px; margin-bottom: 20px;">Welcome to Movie Magic 🎬</h2>
          <p style="font-size: 16px; color: #b3b3b3; line-height: 1.5;">Thank you for joining us! Please use the 6-digit verification code below to complete your registration.</p>
          <div style="background: #1a1a1a; padding: 25px; border-radius: 10px; display: inline-block; margin: 30px 0; border: 1px dashed #e50914;">
            <p style="font-size: 32px; letter-spacing: 15px; font-weight: 900; color: #ffffff; margin: 0; padding-left: 15px;">${otp}</p>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">This code is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #333; margin: 30px 0;">
          <p style="font-size: 12px; color: #444;">&copy; 2026 Movie Magic Entertainment. All rights reserved.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: 'OTP sent successfully' });

  } catch (error) {
    console.error('OTP Send API Error:', error);
    return res.status(500).json({ error: 'Failed to send OTP email: ' + error.message });
  }
}
