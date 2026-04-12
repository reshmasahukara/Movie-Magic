import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function testEmail() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Test Email',
      text: 'Test body'
    });
    console.log('Email sent:', info.response);
    process.exit(0);
  } catch (err) {
    console.error('Error sending email:', err);
    process.exit(1);
  }
}

testEmail();
