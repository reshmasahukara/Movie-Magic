import { query } from './db.js';

export default async function handler(req, res) {
  try {
    const { method, body } = req;

    if (method !== 'POST') {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { booking_id, card_name, amount, payment_method } = body;

    if (!booking_id || !amount) {
      return res.status(400).json({ error: "Booking ID and Amount are required" });
    }

    // Simulate Payment Processing (90% success rate)
    const isSuccess = Math.random() > 0.1;
    const status = isSuccess ? 'PAID' : 'FAILED';
    const txnId = `TXN_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // 1. Log Payment into 'payments' table
    await query(
      'INSERT INTO payments (booking_id, amount, status, transaction_id, payment_method) VALUES ($1, $2, $3, $4, $5)',
      [booking_id, amount, isSuccess ? 'SUCCESS' : 'FAILURE', txnId, payment_method || 'Credit/Debit Card']
    );

    // 2. Update Booking Status
    await query(
      'UPDATE bookings SET status = $1 WHERE id = $2',
      [status, booking_id]
    );

    if (isSuccess) {
      return res.status(200).json({ 
        success: true, 
        message: "Payment successful!", 
        transaction_id: txnId,
        status: status
      });
    } else {
      return res.status(402).json({ 
        success: false, 
        message: "Payment declined by bank.", 
        transaction_id: txnId,
        status: status
      });
    }

  } catch (error) {
    console.error('Payment API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
