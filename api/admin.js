import { query } from './lib/db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  try {
    const { method, body, query: q } = req;

    // 1. Admin Login Structure Migration & Verification
    if (method === 'POST' && q.action === 'login') {
      const { email, password } = body;
      
      // Ensure robust table schema exists
      await query(`
        CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50),
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'admin'
        )
      `);

      // Seed default admin if missing
      const checkAdmin = await query('SELECT * FROM admins');
      if (checkAdmin.rows.length === 0) {
        const defaultHash = await bcrypt.hash('Admin@123', 10);
        await query(
           'INSERT INTO admins (username, email, password_hash, role) VALUES ($1, $2, $3, $4)', 
           ['admin', 'admin@moviemagic.com', defaultHash, 'superadmin']
        );
      }

      // Perform auth verification
      const result = await query('SELECT * FROM admins WHERE email = $1', [email]);
      if (result.rows.length > 0) {
        const admin = result.rows[0];
        const match = await bcrypt.compare(password, admin.password_hash);
        
        if (match) {
           return res.status(200).json({ success: true, admin: { email: admin.email, role: admin.role } });
        }
      }
      
      return res.status(401).json({ error: "Invalid admin credentials." });
    }

    // 2. Fetch Dashboard Data
    if (method === 'GET' && q.action === 'dash') {
      const customers = await query('SELECT * FROM customer');
      const movies = await query('SELECT * FROM movie');
      const theaters = await query('SELECT * FROM theater');
      const shows = await query('SELECT * FROM shows');
      const events = await query('SELECT * FROM events WHERE status != $1', ['Deleted']);
      const bookings = await query('SELECT b.*, m.movie_name FROM bookings b LEFT JOIN movie m ON b.movie_id = m.movie_id ORDER BY b.created_at DESC');
      const eventBookings = await query('SELECT eb.*, e.event_name FROM event_bookings eb JOIN events e ON eb.event_id = e.id ORDER BY eb.booking_date DESC');
      
      const movieRevenue = bookings.rows.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
      const eventRevenue = eventBookings.rows.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
      const totalRevenue = movieRevenue + eventRevenue;

      return res.status(200).json({
        success: true,
        data: {
          customers: customers.rows,
          movies: movies.rows,
          theaters: theaters.rows,
          shows: shows.rows,
          events: events.rows,
          bookings: bookings.rows,
          eventBookings: eventBookings.rows,
          analytics: {
             revenue: totalRevenue,
             totalTickets: bookings.rows.length + eventBookings.rows.length
          }
        }
      });
    }

    // 3. CRUD Operations
    if (method === 'POST') {
      const { action } = q;
      if (action === 'addMovie') {
        const { movieId, movieName, movieRating, movieDimensions, movieGenre, movieStatus, movieDescription, movieLanguage, theaterId, Timmings, showdate, screenno, screendimensions, noofseats, selectedseats } = body;
        await query('INSERT INTO movie (movie_id, movie_name, movie_rating, movie_dimensions, genre, status, description, language) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (movie_id) DO NOTHING', [movieId, movieName, movieRating, movieDimensions, movieGenre, movieStatus, movieDescription, movieLanguage]);
        await query('INSERT INTO theater1 (theater_id, movie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [theaterId, movieId]);
        await query('INSERT INTO shows (movie_id, theater_id, timmings, show_date, screen_no, screen_dimensions, no_of_seats, selected_seats) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [movieId, theaterId, Timmings, showdate, screenno, screendimensions, noofseats, JSON.parse(JSON.stringify(selectedseats || '[]'))]);
        return res.status(200).json({ success: true, message: "Movie added" });
      }

      if (action === 'removeMovie') {
        const { movieId, theaterId, showId } = body;
        if (showId) await query('DELETE FROM shows WHERE screen_id = $1', [showId]);
        return res.status(200).json({ success: true, message: "Movie removed" });
      }

      if (action === 'removeCustomer') {
        const { customeremail } = body;
        await query('DELETE FROM customer WHERE email = $1', [customeremail]);
        return res.status(200).json({ success: true, message: "Customer removed" });
      }
    }

    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error('Admin API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
