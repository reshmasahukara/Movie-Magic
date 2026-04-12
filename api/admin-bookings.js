import { query } from './lib/db.js';

export default async function handler(req, res) {
  const { method } = req;
  
  try {
    if (method === 'GET') {
      const result = await query(`
        SELECT 
          'MM' || b.id as display_id, 
          'Movie' as type, 
          c.name as customer_name, 
          c.email as customer_email, 
          m.movie_name as item_name, 
          b.selected_seats::text as details, 
          b.price as amount, 
          b.payment_status as status, 
          b.created_at
        FROM bookings b
        LEFT JOIN customer c ON b.user_id = c.user_id
        LEFT JOIN movie m ON b.movie_id = m.movie_id

        UNION ALL

        SELECT 
          'EV' || eb.id as display_id, 
          'Event' as type, 
          eb.user_name as customer_name, 
          eb.email as customer_email, 
          e.event_name as item_name, 
          'Qty ' || eb.tickets_count as details, 
          eb.amount as amount, 
          eb.payment_status as status, 
          eb.booking_date as created_at
        FROM event_bookings eb
        LEFT JOIN events e ON eb.event_id = e.id
        
        ORDER BY created_at DESC
      `);
      
      return res.status(200).json({ success: true, list: result.rows });
    }
  } catch (error) {
    console.error('Admin Bookings API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
