import { query } from './lib/db.js';

export default async function handler(req, res) {
  const { method } = req;
  
  try {
    if (method === 'GET') {
      const usersCount = await query('SELECT COUNT(*) FROM customer');
      const movieBookingsCount = await query('SELECT COUNT(*) FROM bookings');
      const eventBookingsCount = await query('SELECT COUNT(*) FROM event_bookings');
      
      const movieRev = await query('SELECT SUM(price) as total FROM bookings');
      const eventRev = await query('SELECT SUM(amount) as total FROM event_bookings');
      
      const todayRev = await query(`
        SELECT SUM(amount) FROM (
          SELECT price as amount FROM bookings WHERE created_at >= CURRENT_DATE
          UNION ALL
          SELECT amount FROM event_bookings WHERE booking_date >= CURRENT_DATE
        ) as today
      `);
      
      const refundAmt = await query("SELECT SUM(amount) FROM event_bookings WHERE payment_status = 'Refunded'");

      return res.status(200).json({
        success: true,
        stats: {
          users: usersCount.rows[0].count,
          movieBookings: movieBookingsCount.rows[0].count,
          eventBookings: eventBookingsCount.rows[0].count,
          totalRevenue: (parseFloat(movieRev.rows[0].total || 0) + parseFloat(eventRev.rows[0].total || 0)).toFixed(2),
          todayRevenue: parseFloat(todayRev.rows[0].sum || 0).toFixed(2),
          refundAmount: parseFloat(refundAmt.rows[0].sum || 0).toFixed(2)
        }
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
