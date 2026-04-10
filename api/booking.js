import db from './db.js';

export default async function handler(req, res) {
  try {
    const { method, query: q, body, headers } = req;

    // 1. Get Seats Data
    if (method === 'GET' && q.action === 'getseats') {
      const screen_id = headers['screen_id'];
      if (!screen_id) return res.status(400).json({ error: "screen_id header missing" });
      const result = await db.query('SELECT selected_seats FROM shows WHERE screen_id = $1', [screen_id]);
      return res.status(200).json({ success: true, seats: result.rows[0]?.selected_seats || [] });
    }

    // 2. Booking Success Check
    if (method === 'GET' && q.action === 'success') {
      const { userid, screenid } = q;
      const result = await db.query('SELECT * FROM bookings WHERE user_id = $1 AND screen_id = $2', [userid, screenid]);
      return res.status(200).json({ success: true, bookings: result.rows });
    }

    // 3. Book Seats Logic
    if (method === 'POST') {
      const { screenid, user_id, noofseats, seats, price } = body;
      if (!screenid || !user_id || !seats) {
        return res.status(400).json({ error: "Missing booking details" });
      }

      await db.query(
        'UPDATE shows SET selected_seats = COALESCE(selected_seats, \'[]\'::jsonb) || $1::jsonb WHERE screen_id = $2',
        [JSON.stringify(seats), screenid]
      );

      const existing = await db.query('SELECT * FROM bookings WHERE screen_id = $1 AND user_id = $2', [screenid, user_id]);
      if (existing.rows.length > 0) {
        await db.query(
          'UPDATE bookings SET no_of_seats = no_of_seats + $1, selected_seats = COALESCE(selected_seats, \'[]\'::jsonb) || $2::jsonb, price = price + $3 WHERE id = $4',
          [noofseats, JSON.stringify(seats), price, existing.rows[0].id]
        );
      } else {
        await db.query(
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
