import { query } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: `Method ${req.method} Not Allowed` });

  try {
    const { userId, showId, seats, amount } = req.body;

    if (!userId || !showId || !seats || seats.length === 0) {
      return res.status(400).json({ error: "Missing required booking data (userId, showId, or seats)" });
    }

    try {
      // 1. Transaction Start
      await query('BEGIN');

      // 2. Identity Resolution & Fallback Creation
      let result = await query("SELECT screen_id, movie_id FROM shows WHERE screen_id = $1 FOR UPDATE", [showId]);

      if (result.rows.length === 0) {
        const parts = showId.split('-'); 
        const date = (parts.length >= 5) ? `${parts[2]}-${parts[3]}-${parts[4]}` : 'CURRENT_DATE';
        const sNo = parts[1] ? parseInt(parts[1].replace('S', '')) : 1;
        const { rows: tRows } = await query('SELECT theater_id FROM theater LIMIT 1');
        const tid = tRows[0]?.theater_id || 1;
        const mid = req.body.movieId || 'M001';

        await query(
          `INSERT INTO shows (screen_id, movie_id, theater_id, timmings, show_date, screen_no) 
           VALUES ($1, $2, $3, '10:15:00', $4, $5) 
           ON CONFLICT (screen_id) DO NOTHING`,
          [showId, mid, tid, date, sNo]
        );
        result = await query("SELECT screen_id, movie_id FROM shows WHERE screen_id = $1 FOR UPDATE", [showId]);
      }

      const showRecord = result.rows[0];
      if (showRecord && showRecord.movie_id && showRecord.movie_id !== req.body.movieId && req.body.movieId) {
        await query('ROLLBACK');
        return res.status(409).json({ error: "Time slot already occupied by another movie screening." });
      }

      // 3. ATOMIC LOCKING: Insert individual seats into booked_seats
      // If any seat is already booked, this will fail with a Unique Violation
      try {
        for (const seat of seats) {
          await query(
            "INSERT INTO booked_seats (screen_id, seat_number) VALUES ($1, $2)",
            [showId, seat]
          );
        }
      } catch (lockErr) {
        await query('ROLLBACK');
        if (lockErr.code === '23505') { // Postgres Unique Violation
          return res.status(409).json({ error: "One or more selected seats were just booked by another user. Please refresh and try again." });
        }
        throw lockErr;
      }

      // 4. Update aggregate selected_seats in Shows (for easy rendering)
      await query(
        "UPDATE shows SET selected_seats = COALESCE(selected_seats, '[]'::jsonb) || $1::jsonb WHERE screen_id = $2",
        [JSON.stringify(seats), showId]
      );

      // 5. Create the Booking Record
      const bookingResult = await query(
        "INSERT INTO bookings (user_id, screen_id, no_of_seats, selected_seats, price, payment_status) VALUES ($1, $2, $3, $4, $5, 'Paid') RETURNING id",
        [userId, showId, seats.length, JSON.stringify(seats), amount]
      );

      const bookingId = bookingResult.rows[0].id;

      // 6. Link locks to the booking ID for future reference
      await query(
        "UPDATE booked_seats SET booking_id = $1 WHERE screen_id = $2 AND seat_number = ANY($3::text[])",
        [bookingId, showId, seats]
      );

      await query('COMMIT');

      return res.status(200).json({ 
        success: true, 
        message: "Booking successful", 
        bookingId: bookingId 
      });

    } catch (dbErr) {
      await query('ROLLBACK');
      console.error("Database Operation Failed:", dbErr);
      return res.status(500).json({ error: `Database Error: ${dbErr.message}` });
    }

  } catch (err) {
    console.error("Critical Booking API Error:", err);
    return res.status(500).json({ error: "Critical server error. Please try again later." });
  }
}
