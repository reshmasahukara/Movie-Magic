import { query } from './db.js';

export default async function handler(req, res) {
  try {
    const { method, query: q, body } = req;

    // 1. GET SEATS: Require exact show identification
    if (method === 'GET' && q.action === 'getseats') {
      const { screen_id, show_date, show_time } = q;
      if (!screen_id || !show_date || !show_time) {
        return res.status(400).json({ error: "Missing required identification: screen_id, show_date, and show_time" });
      }

      const result = await query(
        'SELECT selected_seats FROM shows WHERE screen_id = $1', 
        [screen_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(200).json({ success: true, seats: [], dynamic: true });
      }
      return res.status(200).json({ success: true, seats: result.rows[0].selected_seats || [] });
    }

    // 2. BOOKING SUCCESS: Fetch by specific ID or fallback to latest for user/screen
    if (method === 'GET' && q.action === 'success') {
      const { userid, screenid, bookingid } = q;
      
      let result;
      if (bookingid) {
        result = await query(
          `SELECT b.*, m.movie_name, s.timmings, TO_CHAR(COALESCE(s.show_date, b.show_date), 'YYYY-MM-DD') AS show_date
           FROM bookings b 
           JOIN movie m ON b.movie_id = m.movie_id 
           LEFT JOIN shows s ON b.screen_id = s.screen_id
           WHERE b.id = $1 AND b.user_id = $2`,
          [bookingid, userid]
        );
      } else {
        result = await query(
          `SELECT b.*, m.movie_name, s.timmings, TO_CHAR(COALESCE(s.show_date, b.show_date), 'YYYY-MM-DD') AS show_date
           FROM bookings b 
           JOIN movie m ON b.movie_id = m.movie_id 
           LEFT JOIN shows s ON b.screen_id = s.screen_id
           WHERE b.user_id = $1 AND b.screen_id = $2 
           ORDER BY b.created_at DESC LIMIT 1`,
          [userid, screenid]
        );
      }
      
      return res.status(200).json({ success: true, bookings: result.rows });
    }

    // 3. BOOKING HISTORY: chronological list with no duplicates
    if (method === 'GET' && q.action === 'history') {
      const { userid } = q;
      if (!userid) return res.status(400).json({ error: "userid is required" });
      
      const result = await query(
        `SELECT b.*, m.movie_name, s.timmings, TO_CHAR(COALESCE(s.show_date, b.show_date), 'YYYY-MM-DD') AS show_date
         FROM bookings b 
         LEFT JOIN movie m ON b.movie_id = m.movie_id 
         LEFT JOIN shows s ON b.screen_id = s.screen_id
         WHERE b.user_id = $1 
         ORDER BY b.created_at DESC`,
        [userid]
      );
      return res.status(200).json({ success: true, bookings: result.rows });
    }

    // 4. POST: TRANSACTIONAL BOOKING
    if (method === 'POST') {
      const { 
        screenid, user_id, noofseats, seats: rawSeats, price, 
        payment_status, movie_id, show_date, show_time, theater_name 
      } = body;

      if (!screenid || !user_id || !rawSeats || !show_date || !show_time) {
        return res.status(400).json({ error: "Missing critical booking details (screenid, user_id, seats, date, or time)" });
      }

      // EXTRA SAFETY: Normalization (Trim + Upper) and Deduplication
      const seats = [...new Set(rawSeats.map(s => s.toString().trim().toUpperCase()))];

      try {
        await query('BEGIN'); // TRANSACTION START

        // 1. UPSERT SHOW: Ensure show exists to satisfy Foreign Key constraints
        await query(
          `INSERT INTO shows (screen_id, movie_id, theater_id, timmings, show_date, screen_no, screen_dimensions) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           ON CONFLICT (screen_id) DO NOTHING`,
          [screenid, movie_id || 'M001', 1, show_time, show_date, 1, '2D']
        );

        // 2. Lock the row (FOR UPDATE) and check seats
        const showRes = await query(
          'SELECT selected_seats FROM shows WHERE screen_id = $1 FOR UPDATE',
          [screenid]
        );

        let existingSeats = [];
        if (showRes.rows.length > 0) {
          const rawOccupied = showRes.rows[0].selected_seats || [];
          existingSeats = rawOccupied.map(s => s.toString().trim().toUpperCase());
        }

        // 3. Conflict Check (Overlap)
        const overlap = seats.filter(s => existingSeats.includes(s));
        if (overlap.length > 0) {
          await query('ROLLBACK');
          return res.status(400).json({ 
            success: false, 
            message: `Seat ${overlap[0]} already booked`,
            conflicts: overlap 
          });
        }

        // 4. Update Shows Table selected_seats
        await query(
          'UPDATE shows SET selected_seats = COALESCE(selected_seats, \'[]\'::jsonb) || $1::jsonb WHERE screen_id = $2',
          [JSON.stringify(seats), screenid]
        );

        // 5. Create Booking Record
        const bookingRes = await query(
          `INSERT INTO bookings (
            screen_id, user_id, movie_id, no_of_seats, selected_seats, 
            price, payment_status, show_date, show_time, theater_name
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
          [
            screenid, user_id, movie_id, seats.length, JSON.stringify(seats), 
            price, payment_status || 'Paid', show_date, show_time, theater_name
          ]
        );

        const bookingId = bookingRes.rows[0].id;

        // 6. Secure individual seat locks (Must use exact screenid to satisfy booked_seats foreign key)
        for (const seat of seats) {
          await query(
            "INSERT INTO booked_seats (booking_id, screen_id, seat_number) VALUES ($1, $2, $3)",
            [bookingId, screenid, seat]
          );
        }

        await query('COMMIT'); // TRANSACTION COMMIT
        return res.status(200).json({ success: true, message: 'Seats booked successfully!', bookingId });

      } catch (innerErr) {
        await query('ROLLBACK');
        console.error('Transactional Booking Error:', innerErr);
        // Catch concurrent unique violations (the final line of defense)
        if (innerErr.code === '23505') {
          return res.status(400).json({ success: false, message: "Seat already booked" });
        }
        throw innerErr;
      }
    }

    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error('Booking API Logic Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
