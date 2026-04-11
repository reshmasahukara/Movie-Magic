import { query } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: `Method ${req.method} Not Allowed` });

  try {
    const { userId, showId, seats, amount } = req.body;

    if (!userId || !showId || !seats || seats.length === 0) {
      return res.status(400).json({ error: "Missing required booking data (userId, showId, or seats)" });
    }

    try {
      // PART 1: IDENTITY RESOLUTION (Isolate by Unique Screen Key)
      let result = await query("SELECT screen_id, selected_seats, movie_id FROM shows WHERE screen_id = $1", [showId]);

      if (result.rows.length === 0) {
        // AUTO-SYNC: Create the show record if it's the first booking for this specific screening
        const parts = showId.split('-'); // e.g., ["CIN", "S1", "2026", "05", "20", "101500"]
        const mid = req.body.movieId || 'M001'; 
        
        // Correctly join the date parts if it follows the YYYY-MM-DD format (indices 2, 3, 4)
        const date = (parts.length >= 5) ? `${parts[2]}-${parts[3]}-${parts[4]}` : 'CURRENT_DATE';
        
        // Screen number is usually the second part
        const sNo = parts[1] ? parseInt(parts[1].replace('S', '')) : 1;
        
        const { rows: tRows } = await query('SELECT theater_id FROM theater LIMIT 1');
        const tid = tRows[0]?.theater_id || 1;

        await query(
          `INSERT INTO shows (screen_id, movie_id, theater_id, timmings, show_date, screen_no) 
           VALUES ($1, $2, $3, '10:15:00', $4, $5) 
           ON CONFLICT (screen_id) DO NOTHING`,
          [showId, mid, tid, date, sNo]
        );
        
        result = await query("SELECT screen_id, selected_seats, movie_id FROM shows WHERE screen_id = $1", [showId]);
      }

      const showRecord = result.rows[0];
      
      // TASK 3: Strict Collision Check
      // If the slot is taken by a DIFFERENT movie, block it
      if (showRecord && showRecord.movie_id && showRecord.movie_id !== req.body.movieId && req.body.movieId) {
        return res.status(409).json({ error: "Time slot already occupied by another movie screening." });
      }

      const existingSeats = showRecord?.selected_seats || [];

      // PART 2: ISOLATED CONFLICT CHECK
      // Only check against seats in THIS specific show_id
      const conflict = seats.filter(seat => existingSeats.includes(seat));
      if (conflict.length > 0) {
        return res.status(400).json({ error: `Seats [${conflict.join(', ')}] are already booked for this specific screening.` });
      }

      // 3. Update seats in Shows Table
      const updatedSeats = [...existingSeats, ...seats];
      await query("UPDATE shows SET selected_seats = $1 WHERE screen_id = $2", [
        JSON.stringify(updatedSeats),
        showId
      ]);

      // 4. Save record in Bookings Table (Using smartId for screen_id)
      const bookingResult = await query(
        "INSERT INTO bookings (user_id, screen_id, no_of_seats, selected_seats, price, payment_status) VALUES ($1, $2, $3, $4, $5, 'Paid') RETURNING id",
        [userId, showId, seats.length, JSON.stringify(seats), amount]
      );

      return res.status(200).json({ 
        success: true, 
        message: "Booking successful", 
        bookingId: bookingResult.rows[0].id 
      });

    } catch (dbErr) {
      console.error("Database Operation Failed:", dbErr);
      return res.status(500).json({ error: `Database Error: ${dbErr.message}` });
    }

  } catch (err) {
    console.error("Critical Booking API Error:", err);
    return res.status(500).json({ error: "Critical server error. Please try again later." });
  }
}
