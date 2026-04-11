import { query } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { booking_id, amount, payment_method } = req.body;

    // 1. Precise Validation
    const numericAmount = parseFloat(amount);
    if (!booking_id || isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Invalid payment details. Booking ID and positive Amount are required." });
    }

    try {
      await query('BEGIN'); // TRANSACTION START

      // 2. Validate Booking exists and lock it
      const bookingRes = await query(
        'SELECT * FROM bookings WHERE id = $1 FOR UPDATE', 
        [booking_id]
      );

      if (bookingRes.rows.length === 0) {
        await query('ROLLBACK');
        return res.status(404).json({ error: "Invalid booking. Order does not exist." });
      }

      const booking = bookingRes.rows[0];

      // 3. Prevent Duplicate Payments (Idempotency)
      const existingPayRes = await query(
        "SELECT transaction_id FROM payments WHERE booking_id = $1 AND status = 'SUCCESS'",
        [booking_id]
      );

      if (existingPayRes.rows.length > 0) {
        await query('ROLLBACK');
        return res.status(200).json({ 
          success: true, 
          message: "Already paid", 
          transaction_id: existingPayRes.rows[0].transaction_id,
          booking_id: booking_id,
          status: 'Paid'
        });
      }

      // 4. Generate Professional Transaction ID
      const timestamp = Date.now();
      const random = Math.floor(1000 + Math.random() * 9000);
      const txnId = `TXN${timestamp}${random}`;

      // 5. Process "Always Success" Logic for testing
      const isSuccess = true; 

      // 6. Log Payment
      await query(
        'INSERT INTO payments (booking_id, amount, status, transaction_id, payment_method) VALUES ($1, $2, $3, $4, $5)',
        [booking_id, numericAmount, isSuccess ? 'SUCCESS' : 'FAILURE', txnId, payment_method || 'Digital Gateway']
      );

      // 7. Update Booking Status (Only if successful and not already paid)
      if (isSuccess && booking.payment_status !== 'Paid') {
        await query(
          "UPDATE bookings SET payment_status = 'Paid' WHERE id = $1",
          [booking_id]
        );
      }

      await query('COMMIT'); // TRANSACTION COMMIT

      return res.status(200).json({ 
        success: true, 
        transaction_id: txnId,
        booking_id: booking_id,
        status: 'Paid'
      });

    } catch (innerErr) {
      await query('ROLLBACK');
      console.error('Payment Transaction Failed:', innerErr);
      return res.status(500).json({ error: `Database Error: ${innerErr.message}` });
    }

  } catch (err) {
    console.error('Payment API Handler Error:', err);
    return res.status(500).json({ error: "Critical server error during payment processing." });
  }
}
