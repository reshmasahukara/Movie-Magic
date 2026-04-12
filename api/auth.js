import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { query } from './lib/db.js';

export default async function handler(req, res) {
  const { method } = req;
  const { action } = req.query;

  if (method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    switch (action) {
      case 'login':
        return await handleLogin(req, res);
      case 'register':
        return await handleRegister(req, res);
      case 'sendotp':
        return await handleSendOtp(req, res);
      case 'forgot-password':
        return await handleForgotPassword(req, res);
      case 'verify-reset-otp':
        return await handleVerifyResetOtp(req, res);
      case 'reset-password':
        return await handleResetPassword(req, res);
      case 'google-login':
        return await handleGoogleLogin(req, res);
      default:
        return res.status(400).json({ error: 'Invalid auth action' });
    }
  } catch (error) {
    console.error(`Auth API Error [${action}]:`, error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleLogin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const result = await query('SELECT * FROM customer WHERE email = $1', [email]);
  if (result.rows.length === 0) return res.status(404).json({ error: "User Not Found" });

  const user = result.rows[0];
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Invalid password" });

  const { password: _, ...userData } = user;
  return res.status(200).json({ success: true, user: userData });
}

async function handleRegister(req, res) {
  const { username: name, email, password, city, contactno, otp } = req.body;
  if (!name || !email || !password || !otp) return res.status(400).json({ error: "All fields required" });

  const checkOtp = await query(
    'SELECT id FROM otp_verifications WHERE email = $1 AND otp = $2 AND expires_at > NOW()',
    [email, otp]
  );
  if (checkOtp.rows.length === 0) return res.status(401).json({ error: "Invalid or expired OTP" });

  const checkUser = await query('SELECT user_id FROM customer WHERE email = $1', [email]);
  if (checkUser.rows.length > 0) return res.status(409).json({ error: "Email already exists" });

  const hashpass = await bcrypt.hash(password, 10);
  const result = await query(
    'INSERT INTO customer (name, email, password, city, contact_no) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
    [name, email, hashpass, city, contactno]
  );

  await query('DELETE FROM otp_verifications WHERE email = $1', [email]);
  return res.status(201).json({ success: true, user: { user_id: result.rows[0].user_id, name, email } });
}

async function handleSendOtp(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const checkUser = await query('SELECT user_id FROM customer WHERE email = $1', [email]);
  if (checkUser.rows.length > 0) return res.status(400).json({ error: 'Email already registered' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await query('DELETE FROM otp_verifications WHERE email = $1', [email]);
  await query('INSERT INTO otp_verifications (email, otp, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'5 minutes\')', [email, otp]);

  await sendMail(email, 'Movie Magic Email Verification OTP', otp, 'Welcome to Movie Magic 🎬', 'Please use the 6-digit verification code below to complete your registration.');
  return res.status(200).json({ success: true, message: 'OTP sent successfully' });
}

async function handleForgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const userExist = await query('SELECT user_id FROM customer WHERE email = $1', [email]);
  if (userExist.rows.length === 0) return res.status(404).json({ error: 'Email address not registered' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await query('DELETE FROM otp_verifications WHERE email = $1', [email]);
  await query('INSERT INTO otp_verifications (email, otp, expires_at, is_verified) VALUES ($1, $2, NOW() + INTERVAL \'5 minutes\', FALSE)', [email, otp]);

  await sendMail(email, 'Movie Magic Password Reset OTP', otp, 'Password Reset Request 🎬', 'Your OTP for resetting your Movie Magic password is:');
  return res.status(200).json({ success: true, message: 'OTP sent successfully' });
}

async function handleVerifyResetOtp(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

  const check = await query(
    'SELECT id FROM otp_verifications WHERE email = $1 AND otp = $2 AND expires_at > NOW()',
    [email, otp]
  );
  if (check.rows.length === 0) return res.status(401).json({ error: 'Invalid or expired OTP' });

  await query('UPDATE otp_verifications SET is_verified = TRUE WHERE email = $1 AND otp = $2', [email, otp]);
  return res.status(200).json({ success: true });
}

async function handleResetPassword(req, res) {
  const { email, otp, password } = req.body;
  if (!email || !otp || !password) return res.status(400).json({ error: 'Missing required data' });

  const isVerified = await query(
    'SELECT id FROM otp_verifications WHERE email = $1 AND otp = $2 AND is_verified = TRUE AND expires_at > NOW()',
    [email, otp]
  );
  if (isVerified.rows.length === 0) return res.status(401).json({ error: 'Verification required' });

  const hashpass = await bcrypt.hash(password, 10);
  await query('UPDATE customer SET password = $1 WHERE email = $2', [hashpass, email]);
  await query('DELETE FROM otp_verifications WHERE email = $1', [email]);
  return res.status(200).json({ success: true });
}

async function handleGoogleLogin(req, res) {
  const { name, email, profile_pic } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const result = await query('SELECT * FROM customer WHERE email = $1', [email]);
  
  if (result.rows.length > 0) {
    const user = result.rows[0];
    if (user.profile_pic !== profile_pic) {
      await query('UPDATE customer SET profile_pic = $1 WHERE email = $2', [profile_pic, email]);
      user.profile_pic = profile_pic;
    }
    const { password: _, ...userData } = user;
    return res.status(200).json({ success: true, user: userData });
  } else {
    const newUser = await query(
      'INSERT INTO customer (name, email, provider, profile_pic, city, contact_no) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, 'google', profile_pic, 'Not Set', req.body.contact_no || null]
    );
    const { password: _, ...userData } = newUser.rows[0];
    return res.status(201).json({ success: true, user: userData });
  }
}

async function sendMail(to, subject, otp, title, subtitle) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  const mailOptions = {
    from: '"Movie Magic 🎬" <moviemagic1911@gmail.com>',
    to, subject,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #0c0c0c; color: white; padding: 40px; border-radius: 12px; text-align: center; border: 1px solid #333;">
        <h2 style="color: #e50914;">${title}</h2>
        <p style="color: #b3b3b3;">${subtitle}</p>
        <div style="background: #1a1a1a; padding: 25px; border-radius: 10px; display: inline-block; margin: 30px 0; border: 1px dashed #e50914;">
          <p style="font-size: 32px; letter-spacing: 15px; font-weight: 900; color: #ffffff; margin: 0;">${otp}</p>
        </div>
      </div>`
  };
  await transporter.sendMail(mailOptions);
}
