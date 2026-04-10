import db from '../utils/db.js';
import { renderView } from '../utils/render.js';

export default async function handler(req, res) {
  try {
    const { method, query: q, url, headers, body } = req;

    // 1. Get Seats Data (JSON)
    if (method === 'GET' && url.includes('action=getseats')) {
      const screen_id = headers['screen_id'];
      if (!screen_id) return res.status(400).json({ error: "screen_id header missing" });
      const result = await db.query('SELECT selected_seats FROM shows WHERE screen_id = $1', [screen_id]);
      return res.status(200).json(result.rows);
    }

    // 2. Theater Details (JSON)
    if (method === 'GET' && url.includes('action=theaterdetails')) {
      const theaterid = headers['theater_id'];
      if (!theaterid) return res.status(400).json({ error: "theater_id header missing" });
      const tdata = await db.query('SELECT * FROM theater WHERE theater_id = $1', [theaterid]);
      const sdata = await db.query('SELECT * FROM shows WHERE theater_id = $1', [theaterid]);
      return res.json({ theater: tdata.rows, shows: sdata.rows });
    }

    // 3. Success Page (EJS)
    if (method === 'GET' && url.includes('action=success')) {
      const { userid, screenid } = q;
      if (!userid || !screenid) return res.status(400).json({ error: "Missing userid or screenid" });
      const result = await db.query('SELECT * FROM bookings WHERE user_id = $1 AND screen_id = $2', [userid, screenid]);
      return await renderView(res, 'success', { success: result.rows });
    }

    // 4. Seats Selection Page (EJS)
    if (method === 'GET' && url.includes('action=select')) {
      return await renderView(res, 'seats');
    }

    // 5. Book Seats Logic (POST)
    if (method === 'POST' && url.includes('action=book')) {
      const { screenid, user_id, noofseats, seats, price } = body;
      if (!screenid || !user_id || !seats) {
        return res.status(400).json({ error: "Missing booking details" });
      }

      // Update show capacity using PostgreSQL JSONB concatenation
      await db.query(
        'UPDATE shows SET selected_seats = COALESCE(selected_seats, \'[]\'::jsonb) || $1::jsonb WHERE screen_id = $2',
        [JSON.stringify(seats), screenid]
      );

      // Record booking
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
      return res.status(200).json({ message: 'Seats booked successfully!' });
    }

    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error('Booking API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
