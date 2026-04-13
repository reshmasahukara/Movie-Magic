import { query } from './lib/db.js';

// Helper for Movie ID normalization (Task: Handle M001 vs 1)
function normalizeMovieId(id) {
  if (!id) return id;
  const s = String(id).toUpperCase();
  if (s.startsWith('M') && !isNaN(s.substring(1))) {
    // It's already M001 format
    return s;
  }
  if (!isNaN(s)) {
    // It's a number like 1, convert to M001
    return 'M' + String(s).padStart(3, '0');
  }
  return s;
}

// Auto-Refresher: If all shows are in the past, shift them to the current week (For continuous demo stability)
async function refreshShowsIfExpired() {
  try {
    const check = await query("SELECT count(*) FROM shows WHERE show_date >= CURRENT_DATE");
    if (parseInt(check.rows[0].count) === 0) {
      console.log("Database has no upcoming shows. Auto-refreshing schedules for today...");
      await query(`
        UPDATE shows 
        SET show_date = CURRENT_DATE + (show_date - (SELECT MIN(show_date) FROM shows))
      `);
    }
  } catch (err) {
    console.error("Show Refresher Error:", err);
  }
}

export default async function handler(req, res) {
  const { method, query: q, body } = req;
  const action = q.action;

  try {
    if (method === 'GET') {
      // 1. Fetch All Movies / Filtered
      if (action === 'list') {
        const { status, language, genre, city } = q;
        let sql = 'SELECT * FROM movie WHERE status != \'Deleted\'';
        let params = [];

        if (status && status !== 'all') {
          sql += ' AND status = $' + (params.length + 1);
          params.push(status);
        }
        if (language && language !== 'all') {
          sql += ' AND language ILIKE $' + (params.length + 1);
          params.push('%' + language + '%');
        }
        if (genre && genre !== 'all') {
          sql += ' AND genre ILIKE $' + (params.length + 1);
          params.push('%' + genre + '%');
        }

        sql += ' ORDER BY movie_id DESC';
        const result = await query(sql, params);
        return res.status(200).json({ success: true, movies: result.rows });
      }

      // 2. Single Movie Details
      if (action === 'get' && q.id) {
        const mid = normalizeMovieId(q.id);
        const result = await query('SELECT * FROM movie WHERE movie_id = $1', [mid]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Movie not found' });
        return res.status(200).json({ success: true, movie: result.rows[0] });
      }
      
      // 3. Featured Movies for Homepage
      if (action === 'featured') {
        const result = await query("SELECT * FROM movie WHERE status = 'Now Showing' LIMIT 10");
        return res.status(200).json({ success: true, movies: result.rows });
      }

      // 4. Movies for Home Dashboard (Task: Fix mapping)
      if (action === 'moviesdash') {
        await refreshShowsIfExpired(); // Ensure homepage has movies with upcoming shows
        const { city } = q;
        let sql = 'SELECT * FROM movie';
        let params = [];
        
        if (city && city !== 'all' && city !== 'Select City') {
          sql = `
            SELECT DISTINCT m.* FROM movie m
            JOIN shows s ON m.movie_id = s.movie_id
            JOIN theater t ON s.theater_id = t.theater_id
            WHERE t.city = $1 AND s.show_date >= CURRENT_DATE
          `;
          params = [city];
        } else {
          sql += " WHERE status != 'Deleted' ORDER BY movie_id DESC";
        }

        const result = await query(sql, params);
        return res.status(200).json({ success: true, movies: result.rows });
      }

      // 5. Fetch Movie Shows (Task: Fix Visibility)
      if (action === 'shows') {
        await refreshShowsIfExpired(); // Ensure shows are upcoming
        const mid = normalizeMovieId(q.movieId);
        const { city } = q;

        if (!mid) return res.status(400).json({ error: 'Movie ID required' });

        let sql = `
          SELECT s.*, TO_CHAR(s.show_date, 'YYYY-MM-DD') as show_date_str, t.theater_name, TRIM(t.city) as location 
          FROM shows s
          JOIN theater t ON s.theater_id = t.theater_id
          WHERE (s.movie_id = $1 OR s.movie_id = $2)
          AND s.show_date >= CURRENT_DATE - INTERVAL '1 day'
        `;
        
        // Handle numerical fallback: if mid is M001, also check for '1'
        const numericId = mid.startsWith('M') ? parseInt(mid.substring(1), 10).toString() : mid;
        let params = [mid, numericId];

        if (city && city !== 'all' && city !== 'Select City' && city !== 'null') {
          sql += ' AND TRIM(t.city) = $3';
          params.push(city);
        }

        sql += ' ORDER BY s.show_date ASC, s.timmings ASC';
        
        const result = await query(sql, params);
        
        const processed = result.rows.map(row => {
          let time = row.timmings;
          if (typeof time === 'string' && time.includes(':')) {
            const [h, m] = time.split(':');
            const hrs = parseInt(h, 10);
            const ampm = hrs >= 12 ? 'PM' : 'AM';
            const displayHrs = hrs % 12 || 12;
            time = `${displayHrs}:${m} ${ampm}`;
          } else if (time && typeof time.getHours === 'function') {
             const h = time.getHours();
             const m = time.getMinutes().toString().padStart(2, '0');
             const ampm = h >= 12 ? 'PM' : 'AM';
             const displayHrs = h % 12 || 12;
             time = `${displayHrs}:${m} ${ampm}`;
          }
          // Use show_date_str as normalized date
          return { ...row, show_date: row.show_date_str, timmings: time, price: row.price || 150 };
        });

        return res.status(200).json({ success: true, shows: processed });
      }
    }

    // 6. Handle Movie Booking (POST)
    if (method === 'POST') {
      const { 
        screenid, user_id, seats, price, movie_id, 
        theater_name, show_date, show_time 
      } = body;

      if (!screenid || !user_id || !seats || !seats.length) {
        return res.status(400).json({ error: 'Missing booking details' });
      }

      try {
        // Start Transaction
        await query('BEGIN');

        // 1. Insert into Bookings
        const bookingRes = await query(`
          INSERT INTO bookings (
            screen_id, user_id, no_of_seats, selected_seats, 
            price, payment_status, theater_name, movie_id, 
            show_date, show_time
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `, [
          screenid, user_id, seats.length, JSON.stringify(seats), 
          price, 'Pending', theater_name, movie_id, 
          show_date, show_time
        ]);

        const bookingId = bookingRes.rows[0].id;

        // 2. Insert into Booked Seats (Locking mechanism)
        for (const seat of seats) {
          try {
            await query(`
              INSERT INTO booked_seats (booking_id, screen_id, seat_number)
              VALUES ($1, $2, $3)
            `, [bookingId, screenid, seat]);
          } catch (e) {
            if (e.code === '23505') { // Unique constraint violation
               await query('ROLLBACK');
               return res.status(409).json({ error: `Seat ${seat} is already booked.` });
            }
            throw e;
          }
        }

        // 3. Update Shows table (Aggregate view)
        const showRes = await query("SELECT selected_seats FROM shows WHERE screen_id = $1", [screenid]);
        let existingSeats = [];
        if (showRes.rows.length > 0) {
          existingSeats = Array.isArray(showRes.rows[0].selected_seats) 
            ? showRes.rows[0].selected_seats 
            : JSON.parse(showRes.rows[0].selected_seats || '[]');
        }

        const updatedSeats = [...new Set([...existingSeats, ...seats])];
        await query("UPDATE shows SET selected_seats = $1 WHERE screen_id = $2", [JSON.stringify(updatedSeats), screenid]);

        // Commit Transaction
        await query('COMMIT');

        return res.status(201).json({ 
          success: true, 
          message: 'Booking created successfully', 
          bookingId 
        });

      } catch (err) {
        await query('ROLLBACK');
        console.error('Booking Transaction Error:', err);
        return res.status(500).json({ error: 'Booking failed: ' + err.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Movies API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
