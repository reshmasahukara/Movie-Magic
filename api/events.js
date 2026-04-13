import { query } from './lib/db.js';

export default async function handler(req, res) {
  const { method, query: q, body } = req;
  const action = q.action;

  try {
    if (method === 'GET') {
      // 1. List Events with Filters
      if (action === 'list') {
        const { city, category, date } = q;
        let sql = 'SELECT * FROM events WHERE status != $1';
        let params = ['Deleted'];
        
        if (city && city !== 'all' && city !== 'Select City') {
          sql += ' AND (city = $' + (params.length + 1) + ' OR city = \'Online\')';
          params.push(city);
        }
        if (category && category !== 'all') {
          sql += ' AND category = $' + (params.length + 1);
          params.push(category);
        }
        
        sql += ' ORDER BY event_date ASC';
        const result = await query(sql, params);
        
        // Normalize fields for frontend consistency
        const events = result.rows.map(ev => ({
          ...ev,
          event_name: ev.event_name || ev.title || 'United Event', // Fallback for missing names
          image_url: ev.image_url || ev.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400'
        }));
        
        return res.status(200).json({ success: true, events });
      }

      // 2. Fetch Single Event
      if ((action === 'get' || action === 'details') && q.id) {
        const result = await query('SELECT * FROM events WHERE id = $1', [q.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
        return res.status(200).json({ success: true, event: result.rows[0] });
      }

      // 3. User Event History
      if (action === 'history' && q.userid) {
        const userid = q.userid;
        const result = await query(
          `SELECT eb.*, e.event_name, e.venue, e.city, TO_CHAR(e.event_date, 'YYYY-MM-DD') as event_date, e.event_time, e.image_url 
           FROM event_bookings eb 
           JOIN events e ON eb.event_id = e.id 
           WHERE eb.user_id = $1 
           ORDER BY eb.id DESC`,
          [userid]
        );
        return res.status(200).json({ success: true, bookings: result.rows });
      }
    }

    if (method === 'POST') {
      // 4. Book Event
      if (action === 'book') {
        const { event_id, user_id, user_name, email, phone, tickets_count, selected_seats, amount } = body;
        
        if (!event_id || !user_id) return res.status(400).json({ error: 'Missing booking details' });

        const bookingRes = await query(
          `INSERT INTO event_bookings (event_id, user_id, user_name, email, phone, tickets_count, selected_seats, amount, payment_status, booking_date) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Paid', NOW()) RETURNING id`,
          [event_id, user_id, user_name, email, phone, tickets_count || selected_seats.length, selected_seats || [], amount]
        );

        return res.status(201).json({ success: true, bookingId: bookingRes.rows[0].id });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Events API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
