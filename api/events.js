import { query } from './lib/db.js';

const STATIC_EVENTS = [
  { id: 1, event_name: 'Sunburn Home Festival', category: 'Music', city: 'Goa', venue: 'Beachside', event_date: '2026-12-28', image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400', price: 5000, total_seats: 1000 },
  { id: 4, event_name: 'EDM Pulse 2026', category: 'Music', city: 'Mumbai', venue: 'Jio Gardens', event_date: '2026-05-15', image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400', price: 2999, total_seats: 1000 },
  { id: 17, event_name: 'Lollapalooza India', category: 'Music', city: 'Mumbai', venue: 'Mahalaxmi Race Course', event_date: '2026-01-28', image_url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=400', price: 8999, total_seats: 1000 },
  { id: 5, event_name: 'MI vs CSK', category: 'Sports', city: 'Mumbai', venue: 'Wankhede Stadium', event_date: '2026-05-16', image_url: 'https://i.pinimg.com/videos/thumbnails/originals/a0/8f/e0/a08fe047f55493fbca44602ddc5cee5e.0000000.jpg', price: 999, total_seats: 1000 },
  { id: 10, event_name: 'Zakir Khan Live', category: 'Comedy', city: 'Mumbai', venue: 'Shanmukhananda Hall', event_date: '2026-05-20', image_url: 'https://m.media-amazon.com/images/I/71R3yX-S1JL._RI_.jpg', price: 1200, total_seats: 1000 },
  { id: 7, event_name: 'Chalta Hai Comedy', category: 'Comedy', city: 'Hyderabad', venue: 'Shilpakala Vedika', event_date: '2026-05-29', image_url: 'https://m.media-amazon.com/images/I/71MTDZktU9L.jpg', price: 499, total_seats: 1000 },
  { id: 6, event_name: 'Wonderla Adventure', category: 'Outdoor', city: 'Bengaluru', venue: 'Wonderla', event_date: '2026-05-24', image_url: 'https://i.pinimg.com/originals/be/53/74/be53745621b23ab86399d7c0d8b03aaf.jpg', price: 1499, total_seats: 1000 }
];

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
        
        // Merge with static events that pass the filter
        let allEvents = result.rows;
        const seenNames = new Set(allEvents.map(e => e.event_name.toLowerCase()));
        
        const filteredStatics = STATIC_EVENTS.filter(se => {
            if (city && city !== 'all' && se.city !== city && se.city !== 'Online') return false;
            if (category && category !== 'all' && se.category !== category) return false;
            if (seenNames.has(se.event_name.toLowerCase())) return false;
            return true;
        });

        return res.status(200).json({ success: true, events: [...allEvents, ...filteredStatics] });
      }

      // 2. Event Details
      if (action === 'details') {
        const { id } = q;
        const result = await query('SELECT * FROM events WHERE id = $1', [id]);
        
        if (result.rows.length > 0) {
          return res.status(200).json({ success: true, event: result.rows[0] });
        } else {
          // Check Static
          const staticMatch = STATIC_EVENTS.find(se => String(se.id) === String(id));
          if (staticMatch) return res.status(200).json({ success: true, event: staticMatch });
          return res.status(404).json({ error: 'Event not found' });
        }
      }

      // 3. User Booking History
      if (action === 'history') {
        const { userid } = q;
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
      // 4. Create Booking
      if (action === 'book') {
        const { event_id, user_id, user_name, email, phone, tickets_count, selected_seats, amount } = body;
        
        try {
          await query('BEGIN');
          
          // Check availability (Mock for static, DB for real)
          const staticMatch = STATIC_EVENTS.find(se => String(se.id) === String(event_id));
          let event;

          if (staticMatch) {
            event = staticMatch;
          } else {
            const eventRes = await query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [event_id]);
            event = eventRes.rows[0];
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
              for(let i=0; i<tickets_count; i++) updatedSeats.push('QTY_PLACEHOLDER');
            }
            await query('UPDATE events SET booked_seats = $1, status = $2 WHERE id = $3', 
              [JSON.stringify(updatedSeats), newTotalBooked >= event.total_seats ? 'Sold Out' : 'Active', event_id]);
          }

          // Create Booking Record
          const bookingRes = await query(
            `INSERT INTO event_bookings (event_id, user_id, user_name, email, phone, tickets_count, selected_seats, amount, payment_status, booking_date) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Paid', NOW()) RETURNING id`,
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
