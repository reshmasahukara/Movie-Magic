import db from '../utils/db.js';
import { renderView } from '../utils/render.js';

export default async function handler(req, res) {
  const { method, query, url, headers, body } = req;

  // 1. Get Seats Data (JSON)
  if (method === 'GET' && url.includes('getseats')) {
    const screen_id = headers['screen_id'];
    try {
      const result = await db.query('SELECT selected_seats FROM shows WHERE screen_id = $1', [screen_id]);
      return res.status(200).json(result.rows);
    } catch (error) {
      return res.status(500).send("Seats fetch error");
    }
  }

  // 2. Theater Details (JSON)
  if (method === 'GET' && url.includes('theaterdetails')) {
    const theaterid = headers['theater_id'];
    try {
      const tdata = await db.query('SELECT * FROM theater WHERE theater_id = $1', [theaterid]);
      const sdata = await db.query('SELECT * FROM shows WHERE theater_id = $1', [theaterid]);
      return res.json({ theater: tdata.rows, shows: sdata.rows });
    } catch (error) {
      return res.status(500).send("Theater fetch error");
    }
  }

  // 3. Success Page (EJS)
  if (method === 'GET' && url.includes('success')) {
    const { userid, screenid } = query;
    try {
      const result = await db.query('SELECT * FROM bookings WHERE user_id = $1 AND screen_id = $2', [userid, screenid]);
      return await renderView(res, 'success', { success: result.rows });
    } catch (error) {
      return res.status(500).send("Success page error");
    }
  }

  // 4. Seats Selection Page (EJS) - can be GET or POST depending on trigger
  if (url.includes('seats') && method === 'GET') {
      return await renderView(res, 'seats');
  }
  if (url.includes('shows') && method === 'POST') {
      return await renderView(res, 'seats');
  }

  // 5. Book Seats Logic (POST)
  if (method === 'POST' && url.includes('seats')) {
    const { screenid, user_id, noofseats, seats, price } = body;
    try {
      await db.query(
        'UPDATE shows SET selected_seats = selected_seats || $1::jsonb WHERE screen_id = $2',
        [JSON.stringify(seats), screenid]
      );
      const existing = await db.query('SELECT * FROM bookings WHERE screen_id = $1 AND user_id = $2', [screenid, user_id]);
      if (existing.rows.length > 0) {
        await db.query(
          'UPDATE bookings SET no_of_seats = no_of_seats + $1, selected_seats = selected_seats || $2::jsonb, price = price + $3 WHERE id = $4',
          [noofseats, JSON.stringify(seats), price, existing.rows[0].id]
        );
      } else {
        await db.query(
          'INSERT INTO bookings (screen_id, user_id, no_of_seats, selected_seats, price) VALUES ($1, $2, $3, $4, $5)',
          [screenid, user_id, noofseats, JSON.stringify(seats), price]
        );
      }
      return res.status(200).send('Seats booked successful!');
    } catch (error) {
      console.error(error);
      return res.status(500).send("Booking error");
    }
  }

  return res.status(405).send('Method Not Allowed');
}
