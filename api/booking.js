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

    // 3. Book Seats Logic
    if (method === 'POST') {
      const { screenid, user_id, noofseats, seats, price } = body;
      if (!screenid || !user_id || !seats) {
        return res.status(400).json({ error: "Missing booking details" });
      }

      await query(
        'UPDATE shows SET selected_seats = COALESCE(selected_seats, \'[]\'::jsonb) || $1::jsonb WHERE screen_id = $2',
        [JSON.stringify(seats), screenid]
      );

      const existing = await query('SELECT * FROM bookings WHERE screen_id = $1 AND user_id = $2', [screenid, user_id]);
      if (existing.rows.length > 0) {
        await query(
          'UPDATE bookings SET no_of_seats = no_of_seats + $1, selected_seats = COALESCE(selected_seats, \'[]\'::jsonb) || $2::jsonb, price = price + $3 WHERE id = $4',
          [noofseats, JSON.stringify(seats), price, existing.rows[0].id]
        );
      } else {
        await query(
          'INSERT INTO bookings (screen_id, user_id, no_of_seats, selected_seats, price) VALUES ($1, $2, $3, $4, $5)',
          [screenid, user_id, noofseats, JSON.stringify(seats), price]
        );
      }
      return res.status(200).json({ success: true, message: 'Seats booked successfully!' });
    }

    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error('Booking API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
