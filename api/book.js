import { query } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: `Method ${req.method} Not Allowed` });

  try {
    const { userId, showId, seats, amount } = req.body;

    if (!userId || !showId || !seats || seats.length === 0) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    // 1. Get existing booked seats
    // Use screen_id for DB column consistency
    const result = await query("SELECT selected_seats FROM shows WHERE screen_id = $1", [showId]);

    let existingSeats = [];
    if (result.rows.length > 0) {
      existingSeats = result.rows[0].selected_seats || [];
    } else {
      // SELF-HEALING: If show doesn't exist, create it (fallback logic)
      const { rows: tRows } = await query('SELECT theater_id FROM theater LIMIT 1');
      const { rows: mRows } = await query('SELECT movie_id FROM movie LIMIT 1');
      const fallbackTheater = tRows[0]?.theater_id || 1;
      const fallbackMovie = mRows[0]?.movie_id || 'M001';

      await query(
        `INSERT INTO shows (screen_id, movie_id, theater_id, timmings, show_date, screen_no) 
         VALUES ($1, $2, $3, '10:15:00', CURRENT_DATE, 1) 
         ON CONFLICT (screen_id) DO NOTHING`,
        [showId, fallbackMovie, fallbackTheater]
      );
    }

    // 2. Prevent duplicate booking
    const conflict = seats.filter(seat => existingSeats.includes(seat));
    if (conflict.length > 0) {
      return res.status(400).json({ success: false, message: `Seats [${conflict.join(', ')}] are already booked.` });
    }

    // 3. Update seats in Shows Table
    const updatedSeats = [...existingSeats, ...seats];
    await query("UPDATE shows SET selected_seats = $1 WHERE screen_id = $2", [
      JSON.stringify(updatedSeats),
      showId
    ]);

    // 4. Save record in Bookings Table
    const bookingResult = await query(
      "INSERT INTO bookings (user_id, screen_id, no_of_seats, selected_seats, price, payment_status) VALUES ($1, $2, $3, $4, $5, 'Paid') RETURNING id",
      [userId, showId, seats.length, JSON.stringify(seats), amount]
    );

    res.json({ 
      success: true, 
      message: "Booking successful", 
      bookingId: bookingResult.rows[0].id 
    });

  } catch (err) {
    console.error("Booking API Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
