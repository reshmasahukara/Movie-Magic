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
      // We look for a show matching this unique smart ID. 
      // This ensures Seat A1 in Screen X is different from Seat A1 in Screen Y.
      let result = await query("SELECT screen_id, selected_seats FROM shows WHERE screen_id = $1", [showId]);

      if (result.rows.length === 0) {
        // AUTO-SYNC: Create the show record if it's the first booking for this specific screening
        // Parse metadata from smart ID or use defaults
        const parts = showId.split('-'); // e.g., ["CIN", "M001", "2026-05-20", "1015AM"]
        const mid = parts[1] || 'M001';
        const date = parts[2] || 'CURRENT_DATE';
        
        const { rows: tRows } = await query('SELECT theater_id FROM theater LIMIT 1');
        const tid = tRows[0]?.theater_id || 1;

        await query(
          `INSERT INTO shows (screen_id, movie_id, theater_id, timmings, show_date, screen_no) 
           VALUES ($1, $2, $3, '10:15:00', $4, 1) 
           ON CONFLICT (screen_id) DO NOTHING`,
          [showId, mid, tid, date]
        );
        
        // Re-fetch to confirm
        result = await query("SELECT screen_id, selected_seats FROM shows WHERE screen_id = $1", [showId]);
      }

      const showRecord = result.rows[0];
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
