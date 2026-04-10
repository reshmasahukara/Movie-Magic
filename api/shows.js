import { query } from './db.js';

// Unified Mock Registry corresponding to booking.html theater/show IDs
const MOCK_SHOWS = {
  "101": { screen_id: "101", theater_id: 1, theater_name: "Cinepolis: Nexus", timmings: "10:15 AM", movie_name: "Movie Magic", price: 150, format: "2D", selected_seats: [] },
  "102": { screen_id: "102", theater_id: 1, theater_name: "Cinepolis: Nexus", timmings: "06:05 PM", movie_name: "Movie Magic", price: 250, format: "3D", selected_seats: [] },
  "201": { screen_id: "201", theater_id: 2, theater_name: "INOX: DN Regalia Mall", timmings: "10:45 AM", movie_name: "Movie Magic", price: 200, format: "2D", selected_seats: [] },
  "202": { screen_id: "202", theater_id: 2, theater_name: "INOX: DN Regalia Mall", timmings: "07:40 PM", movie_name: "Movie Magic", price: 300, format: "3D", selected_seats: [] },
  "301": { screen_id: "301", theater_id: 3, theater_name: "INOX: Symphony Mall", timmings: "04:00 PM", movie_name: "Movie Magic", price: 180, format: "2D", selected_seats: [] },
  "401": { screen_id: "401", theater_id: 4, theater_name: "PVR: Utkal Kanika Galleria", timmings: "01:15 PM", movie_name: "Movie Magic", price: 220, format: "2D", selected_seats: [] },
  "501": { screen_id: "501", theater_id: 5, theater_name: "PJ Movies (Veena Theatre)", timmings: "06:00 PM", movie_name: "Movie Magic", price: 120, format: "2D", selected_seats: [] }
};

export default async function handler(req, res) {
  const { method, query: q } = req;

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const showId = q.id;
  if (!showId) {
    return res.status(400).json({ error: 'Show ID is required' });
  }

  // 1. Check Mock Data First (guarantees UI stability for these specific development IDs)
  if (MOCK_SHOWS[showId]) {
    return res.status(200).json({
      success: true,
      show: MOCK_SHOWS[showId]
    });
  }

  try {
    // 2. Fallback to Database for dynamic/seeded IDs
    const result = await query(
      `SELECT s.*, t.theater_name, t.location, m.movie_name 
       FROM shows s 
       JOIN theater t ON s.theater_id = t.theater_id 
       JOIN movie m ON s.movie_id = m.movie_id 
       WHERE s.screen_id = $1`,
      [showId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Show not found' });
    }

    return res.status(200).json({
      success: true,
      show: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching show:', error);
    return res.status(500).json({ error: error.message });
  }
}
