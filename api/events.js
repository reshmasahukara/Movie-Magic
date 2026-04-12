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
        if (date) {
          sql += ' AND event_date = $' + (params.length + 1);
          params.push(date);
        }
        
        sql += ' ORDER BY event_date ASC';
        const result = await query(sql, params);
        return res.status(200).json({ success: true, events: result.rows });
      }

      // 2. Event Details
      if (action === 'details') {
        const { id } = q;
        const result = await query('SELECT * FROM events WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
        return res.status(200).json({ success: true, event: result.rows[0] });
      }

      // 3. User Booking History
      if (action === 'history') {
        const { userid } = q;
        const result = await query(
          `SELECT eb.*, e.event_name, e.venue, e.city, TO_CHAR(e.event_date, 'YYYY-MM-DD') as event_date, e.event_time, e.image_url 
           FROM event_bookings eb 
           JOIN events e ON eb.event_id = e.id 
           WHERE eb.user_id = $1 
           ORDER BY eb.booking_date DESC`,
          [userid]
        );
        return res.status(200).json({ success: true, bookings: result.rows });
      }
    }

    if (method === 'POST') {
      // 4. Create Booking
      if (action === 'book') {
        const { event_id, user_id, user_name, email, phone, tickets_count, selected_seats, amount } = body;
        
        try {
          await query('BEGIN');
          
          // Check availability
          const eventRes = await query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [event_id]);
          const event = eventRes.rows[0];
          
          if (!event) throw new Error('Event not found');
          if (event.status === 'Sold Out') throw new Error('Event is sold out');
          
          const currentlyBooked = event.booked_seats || [];
          const newTotalBooked = currentlyBooked.length + (tickets_count || selected_seats.length);
          
          if (newTotalBooked > event.total_seats) throw new Error('Not enough seats available');

          // Update Event Table
          let updatedSeats = [...currentlyBooked];
          if (selected_seats && selected_seats.length > 0) {
            updatedSeats = [...updatedSeats, ...selected_seats];
          } else {
            // For qty-based, we just add placeholders to track count if needed, 
            // but usually we just track the count. Here we'll stick to array length.
            for(let i=0; i<tickets_count; i++) updatedSeats.push('QTY_PLACEHOLDER');
          }

          await query('UPDATE events SET booked_seats = $1, status = $2 WHERE id = $3', 
            [JSON.stringify(updatedSeats), newTotalBooked >= event.total_seats ? 'Sold Out' : 'Active', event_id]);

          // Create Booking Record
          const bookingRes = await query(
            `INSERT INTO event_bookings (event_id, user_id, user_name, email, phone, tickets_count, selected_seats, amount, payment_status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Paid') RETURNING id`,
            [event_id, user_id, user_name, email, phone, tickets_count || selected_seats.length, selected_seats || [], amount]
          );

          await query('COMMIT');
          return res.status(200).json({ success: true, bookingId: bookingRes.rows[0].id });
        } catch (e) {
          await query('ROLLBACK');
          throw e;
        }
      }

      // 5. Admin: Add/Edit Event
      if (action === 'manage') {
        const { id, event_name, category, city, venue, event_date, event_time, price, total_seats, image_url, description, has_seat_map } = body;
        
        if (id) {
          // Edit
          await query(
            `UPDATE events SET event_name=$1, category=$2, city=$3, venue=$4, event_date=$5, event_time=$6, price=$7, total_seats=$8, image_url=$9, description=$10, has_seat_map=$11 
             WHERE id=$12`,
            [event_name, category, city, venue, event_date, event_time, price, total_seats, image_url, description, has_seat_map, id]
          );
          return res.status(200).json({ success: true, message: 'Event updated' });
        } else {
          // Add
          await query(
            `INSERT INTO events (event_name, category, city, venue, event_date, event_time, price, total_seats, image_url, description, has_seat_map) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [event_name, category, city, venue, event_date, event_time, price, total_seats, image_url, description, has_seat_map]
          );
          return res.status(200).json({ success: true, message: 'Event added' });
        }
      }
    }

    if (method === 'DELETE' && action === 'manage') {
      const { id } = body;
      await query('UPDATE events SET status = $1 WHERE id = $2', ['Deleted', id]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Events Domain Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
