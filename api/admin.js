import { query } from './lib/db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  const { method, body, query: q } = req;
  const { action } = q;

  try {
    // 1. ADMIN LOGIN
    if (method === 'POST' && action === 'login') {
      const { email, password } = body;
      const result = await query('SELECT * FROM admins WHERE email = $1', [email]);
      
      if (result.rows.length === 0) return res.status(401).json({ error: 'Admin not found' });
      
      const admin = result.rows[0];
      const match = await bcrypt.compare(password, admin.password);
      
      if (!match) return res.status(401).json({ error: 'Invalid admin credentials' });
      
      const { password: _, ...adminData } = admin;
      return res.status(200).json({ success: true, admin: adminData });
    }

    // 2. DASHBOARD ANALYTICS (GET)
    if (method === 'GET' && action === 'dash') {
      const usersCount = await query('SELECT COUNT(*) FROM customer');
      const movieBookingsCount = await query('SELECT COUNT(*) FROM bookings');
      const eventBookingsCount = await query('SELECT COUNT(*) FROM event_bookings');
      
      const movieRev = await query('SELECT SUM(price) as total FROM bookings');
      const eventRev = await query('SELECT SUM(amount) as total FROM event_bookings');
      
      const moviesCount = await query('SELECT COUNT(*) FROM movie');
      const eventsCount = await query('SELECT COUNT(*) FROM events');

      return res.status(200).json({
        success: true,
        stats: {
          users: usersCount.rows[0].count,
          movieBookings: movieBookingsCount.rows[0].count,
          eventBookings: eventBookingsCount.rows[0].count,
          revenue: (parseFloat(movieRev.rows[0].total || 0) + parseFloat(eventRev.rows[0].total || 0)).toFixed(2),
          movies: moviesCount.rows[0].count,
          events: eventsCount.rows[0].count
        }
      });
    }

    // 3. BOOKINGS LIST (GET)
    if (method === 'GET' && action === 'bookings') {
      const movieB = await query(`
        SELECT b.id, b.user_id, b.amount as price, b.payment_status, b.created_at, m.movie_name as item_name, 'movie' as type
        FROM bookings b
        LEFT JOIN movie m ON b.movie_id = m.movie_id
        ORDER BY b.created_at DESC
      `);
      const eventB = await query(`
        SELECT eb.id, eb.user_id, eb.amount as price, eb.payment_status, eb.booking_date as created_at, e.event_name as item_name, 'event' as type
        FROM event_bookings eb
        LEFT JOIN events e ON eb.event_id = e.id
        ORDER BY eb.booking_date DESC
      `);
      
      const all = [...movieB.rows, ...eventB.rows].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      return res.status(200).json({ success: true, bookings: all });
    }

    // 4. USERS LIST (GET)
    if (method === 'GET' && action === 'users') {
      const result = await query('SELECT user_id, name, email, city, contact_no, is_blocked FROM customer ORDER BY user_id DESC');
      return res.status(200).json({ success: true, users: result.rows });
    }

    // 5. MANAGE USER (POST)
    if (method === 'POST' && action === 'manageUser') {
      const { user_id, block } = body;
      await query('UPDATE customer SET is_blocked = $1 WHERE user_id = $2', [block, user_id]);
      return res.status(200).json({ success: true });
    }

    // 6. CONTENT LISTING (GET)
    if (method === 'GET' && action === 'content') {
      const { type } = q;
      if (type === 'movies') {
        const resu = await query('SELECT * FROM movie ORDER BY movie_id DESC');
        return res.status(200).json({ success: true, list: resu.rows });
      }
      if (type === 'events') {
        const resu = await query('SELECT * FROM events ORDER BY id DESC');
        return res.status(200).json({ success: true, list: resu.rows });
      }
      if (type === 'theatres') {
        const resu = await query('SELECT * FROM theater ORDER BY theater_id DESC');
        return res.status(200).json({ success: true, list: resu.rows });
      }
    }

    // 7. CONTENT MANAGEMENT (POST)
    if (method === 'POST' && action === 'manage') {
      const { type, subAction, data } = body;
      if (type === 'movie' && subAction === 'delete') {
        await query('DELETE FROM movie WHERE movie_id = $1', [data.id]);
        return res.status(200).json({ success: true });
      }
      if (type === 'event' && subAction === 'delete') {
        await query('DELETE FROM events WHERE id = $1', [data.id]);
        return res.status(200).json({ success: true });
      }
      return res.status(400).json({ error: 'Management action not implemented yet' });
    }

    return res.status(400).json({ error: 'Invalid admin action' });
  } catch (error) {
    console.error('Admin API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
