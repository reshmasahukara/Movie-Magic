import { query } from './db.js';

export default async function handler(req, res) {
  try {
    const { method, query: q, body, headers } = req;

    // 1. Get Seats Data
    if (method === 'GET' && q.action === 'getseats') {
      const screen_id = headers['screen_id'];
      if (!screen_id) return res.status(400).json({ error: "screen_id header missing" });
      const result = await query('SELECT selected_seats FROM shows WHERE screen_id = $1', [screen_id]);
      return res.status(200).json({ success: true, seats: result.rows[0]?.selected_seats || [] });
    }

    // 2. Booking Success Check (Single Record)
    if (method === 'GET' && q.action === 'success') {
      const { userid, screenid } = q;
      const result = await query(
        'SELECT b.*, s.timmings, s.show_date, m.movie_name FROM bookings b JOIN shows s ON b.screen_id = s.screen_id JOIN movie m ON s.movie_id = m.movie_id WHERE b.user_id = $1 AND b.screen_id = $2 ORDER BY b.created_at DESC LIMIT 1',
        [userid, screenid]
      );
      return res.status(200).json({ success: true, bookings: result.rows });
    }

    // 2.2 User Booking History (All Records)
    if (method === 'GET' && q.action === 'history') {
      const { userid } = q;
      if (!userid) return res.status(400).json({ error: "userid is required" });
      const result = await query(
        'SELECT b.*, s.timmings, s.show_date, m.movie_name FROM bookings b JOIN shows s ON b.screen_id = s.screen_id JOIN movie m ON s.movie_id = m.movie_id WHERE b.user_id = $1 ORDER BY b.created_at DESC',
        [userid]
      );
      return res.status(200).json({ success: true, bookings: result.rows });
    }

    // 3. Book Seats Logic (Finalized after payment)
    if (method === 'POST') {
      const { screenid, user_id, noofseats, seats, price, payment_status } = body;
      if (!screenid || !user_id || !seats) {
        return res.status(400).json({ error: "Missing booking details" });
      }

      // 1. Fetch current booked seats to prevent double-booking
      const { rows: showRows } = await query('SELECT selected_seats FROM shows WHERE screen_id = $1', [screenid]);
      const currentlyBooked = showRows[0]?.selected_seats || [];
      
      // 2. Check for intersection
      const conflict = seats.filter(seat => currentlyBooked.includes(seat));
      if (conflict.length > 0) {
        return res.status(400).json({ 
          error: `Seats [${conflict.join(', ')}] have just been booked by another user. Please select different seats.`,
          conflict: true
        });
      }

      // 3. If no conflict, update show data to mark seats as occupied
      // SELF-HEALING: Ensure the show record exists in DB to prevent FK violation
      await query(
        `INSERT INTO shows (screen_id, movie_id, theater_id, timmings, show_date, screen_dimensions) 
         VALUES ($1, 'M001', 1, '10:15 AM', CURRENT_DATE, '2D') 
         ON CONFLICT (screen_id) DO NOTHING`,
        [screenid]
      );

      await query(
        'UPDATE shows SET selected_seats = COALESCE(selected_seats, \'[]\'::jsonb) || $1::jsonb WHERE screen_id = $2',
        [JSON.stringify(seats), screenid]
      );

      // 4. Create the record in bookings table
      const result = await query(
        'INSERT INTO bookings (screen_id, user_id, no_of_seats, selected_seats, price, payment_status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [screenid, user_id, noofseats, JSON.stringify(seats), price, payment_status || 'Paid']
      );
      
      return res.status(200).json({ success: true, message: 'Seats booked successfully!', bookingId: result.rows[0].id });
    }

    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error('Booking API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
