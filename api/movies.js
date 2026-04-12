import { query } from './lib/db.js';

export default async function handler(req, res) {
  const { method, query: q, body } = req;
  const action = q.action;

  try {
    if (method === 'GET') {
      // 1. Movies Catalog
      if (action === 'moviesdash' || !action) {
        return await handleGetMovies(req, res);
      }
      // 2. Shows Lookup
      if (action === 'shows') {
        return await handleGetShows(req, res);
      }
      // 3. Seat Availability
      if (action === 'getseats') {
        return await handleGetSeats(req, res);
      }
      // 4. Booking Summary
      if (action === 'success') {
        return await handleBookingSuccess(req, res);
      }
    }

    if (method === 'POST') {
      // 5. Create Booking (Primary POST)
      if (body.screenid && body.seats) {
        return await handleCreateBooking(req, res);
      }
      // 6. Movie Detail Lookup (Theater/Show filter)
      if (body.movieId) {
        return await handleGetMovieDetails(req, res);
      }
    }

    if (method === 'DELETE' && action === 'cancel') {
      return await handleCancelBooking(req, res);
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Movies Domain Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Logic implementations (Extracted from previous micro-files)

async function handleGetMovies(req, res) {
  const { city } = req.query;
  let moviesQuery;
  let params = [];
  
  if (city && city !== 'all') {
    moviesQuery = `
      SELECT DISTINCT ON (m.movie_id) m.* 
      FROM movie m
      LEFT JOIN shows s ON m.movie_id = s.movie_id
      LEFT JOIN theater t ON s.theater_id = t.theater_id
      WHERE (t.city = $1 OR m.status = 'Coming Soon')
      ORDER BY m.movie_id, CASE WHEN m.status = 'Now Showing' THEN 1 ELSE 2 END, m.movie_name ASC
    `;
    params = [city];
  } else {
    moviesQuery = `
      SELECT DISTINCT ON (m.movie_id) m.* FROM movie m
      ORDER BY m.movie_id, CASE WHEN m.status = 'Now Showing' THEN 1 ELSE 2 END, m.movie_name ASC
    `;
  }
  const result = await query(moviesQuery, params);
  const sorted = result.rows.sort((a,b) => (a.status === 'Now Showing' ? 0 : 1) - (b.status === 'Now Showing' ? 0 : 1) || a.movie_name.localeCompare(b.movie_name));
  return res.status(200).json({ success: true, movies: sorted });
}

async function handleGetShows(req, res) {
  const { id: showId, movieId, city } = req.query;
  if (movieId) {
    let sql = `SELECT s.*, t.theater_name, t.city as location FROM shows s JOIN theater t ON s.theater_id = t.theater_id WHERE s.movie_id = $1`;
    let params = [movieId];
    if (city) { sql += ` AND t.city = $2`; params.push(city); }
    const result = await query(sql, params);
    return res.status(200).json({ success: true, shows: result.rows });
  }
  const result = await query(`SELECT s.*, t.theater_name, t.location, m.movie_name FROM shows s JOIN theater t ON s.theater_id = t.theater_id JOIN movie m ON s.movie_id = m.movie_id WHERE s.screen_id = $1`, [showId]);
  if (result.rows.length === 0 && showId.includes('-')) {
    const parts = showId.split('-');
    return res.status(200).json({ success: true, show: { screen_id: showId, movie_id: parts[1] || 'M001', theater_name: parts[0] + " Cinemas", selected_seats: [], timmings: "10:15 AM", price: 150 } });
  }
  return res.status(200).json({ success: true, show: result.rows[0] });
}

async function handleGetSeats(req, res) {
  const { screen_id, show_date, show_time } = req.query;
  const targetDate = String(show_date).split('T')[0];
  const targetTime = decodeURIComponent(show_time).trim();
  const result = await query(
    `SELECT bs.seat_number FROM booked_seats bs JOIN bookings b ON bs.booking_id = b.id WHERE b.screen_id = $1 AND TO_CHAR(b.show_date, 'YYYY-MM-DD') = $2 AND b.show_time = $3`,
    [screen_id, targetDate, targetTime]
  );
  const legacy = await query(`SELECT selected_seats FROM shows WHERE screen_id = $1`, [screen_id]);
  const legacySeats = legacy.rows.length > 0 ? (legacy.rows[0].selected_seats || []) : [];
  const seats = [...new Set([...result.rows.map(r => r.seat_number), ...legacySeats])];
  return res.status(200).json({ success: true, seats });
}

async function handleBookingSuccess(req, res) {
  const { userid, screenid, bookingid } = req.query;
  const sql = bookingid 
    ? [`SELECT b.*, m.movie_name, COALESCE(b.show_time, s.timmings) AS timmings, TO_CHAR(COALESCE(b.show_date, s.show_date), 'YYYY-MM-DD') AS show_date FROM bookings b JOIN movie m ON b.movie_id = m.movie_id LEFT JOIN shows s ON b.screen_id = s.screen_id WHERE b.id = $1 AND b.user_id = $2`, [bookingid, userid]]
    : [`SELECT b.*, m.movie_name, COALESCE(b.show_time, s.timmings) AS timmings, TO_CHAR(COALESCE(b.show_date, s.show_date), 'YYYY-MM-DD') AS show_date FROM bookings b JOIN movie m ON b.movie_id = m.movie_id LEFT JOIN shows s ON b.screen_id = s.screen_id WHERE b.user_id = $1 AND b.screen_id = $2 ORDER BY b.created_at DESC LIMIT 1`, [userid, screenid]];
  const result = await query(sql[0], sql[1]);
  return res.status(200).json({ success: true, bookings: result.rows });
}

async function handleCancelBooking(req, res) {
  const { booking_id, user_id } = req.body;
  const check = await query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [booking_id, user_id]);
  if (check.rows.length === 0) return res.status(404).json({ error: "Booking not found" });
  await query('DELETE FROM booked_seats WHERE booking_id = $1', [booking_id]);
  await query('UPDATE bookings SET payment_status = $1 WHERE id = $2', ['Refunded', booking_id]);
  return res.status(200).json({ success: true });
}

async function handleGetMovieDetails(req, res) {
  const { movieId } = req.body;
  const theaters = await query(`SELECT DISTINCT t.* FROM theater t JOIN shows s ON t.theater_id = s.theater_id WHERE s.movie_id = $1`, [movieId]);
  const shows = await query(`SELECT * FROM shows WHERE movie_id = $1 AND show_date >= CURRENT_DATE ORDER BY show_date ASC, timmings ASC`, [movieId]);
  return res.status(200).json({ success: true, theaters: theaters.rows, shows: shows.rows });
}

async function handleCreateBooking(req, res) {
  const { screenid, user_id, seats: rawSeats, price, movie_id, show_date, show_time, theater_name } = req.body;
  const seats = [...new Set(rawSeats.map(s => s.toString().trim().toUpperCase()))];
  try {
    await query('BEGIN');
    await query(`INSERT INTO shows (screen_id, movie_id, theater_id, timmings, show_date) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (screen_id) DO NOTHING`, [screenid, movie_id || 'M001', 1, show_time, show_date]);
    const resB = await query(`INSERT INTO bookings (screen_id, user_id, movie_id, no_of_seats, selected_seats, price, payment_status, show_date, show_time, theater_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`, [screenid, user_id, movie_id, seats.length, JSON.stringify(seats), price, 'Paid', show_date, show_time, theater_name]);
    const bId = resB.rows[0].id;
    for (const seat of seats) { await query("INSERT INTO booked_seats (booking_id, screen_id, seat_number) VALUES ($1, $2, $3)", [bId, screenid, seat]); }
    await query('COMMIT');
    return res.status(200).json({ success: true, bookingId: bId });
  } catch (e) { await query('ROLLBACK'); throw e; }
}
