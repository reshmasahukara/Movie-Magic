import { query } from './lib/db.js';

export default async function handler(req, res) {
  const { method, query: q, body } = req;
  const action = q.action;

  try {
    if (method === 'GET') {
      // 1. Fetch All Movies / Filtered
      if (action === 'list') {
        const { status, genre } = q;
        let sql = 'SELECT * FROM movie';
        let params = [];

        if (status && status !== 'all') {
          sql += ' WHERE status = $1';
          params.push(status);
        }

        sql += ' ORDER BY movie_id DESC';
        const result = await query(sql, params);
        return res.status(200).json({ success: true, movies: result.rows });
      }

      // 2. Single Movie Details
      if (action === 'get' && q.id) {
        const result = await query('SELECT * FROM movie WHERE movie_id = $1', [q.id]);
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
        const { city } = q;
        let sql = 'SELECT * FROM movie';
        let params = [];
        
        // If city specific, only show movies that have shows in that city
        if (city && city !== 'all' && city !== 'Select City') {
          sql = `
            SELECT DISTINCT m.* FROM movie m
            JOIN shows s ON m.movie_id = s.movie_id
            JOIN theater t ON s.theater_id = t.theater_id
            WHERE t.city = $1
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
        const { movieId, city } = q;
        if (!movieId) return res.status(400).json({ error: 'Movie ID required' });

        let sql = `
          SELECT s.*, t.theater_name, t.city as location 
          FROM shows s
          JOIN theater t ON s.theater_id = t.theater_id
          WHERE s.movie_id = $1
        `;
        let params = [movieId];

        if (city && city !== 'all' && city !== 'Select City' && city !== 'null') {
          sql += ' AND t.city = $2';
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
             // Handle raw boat/pg time objects
             const h = time.getHours();
             const m = time.getMinutes().toString().padStart(2, '0');
             const ampm = h >= 12 ? 'PM' : 'AM';
             const displayHrs = h % 12 || 12;
             time = `${displayHrs}:${m} ${ampm}`;
          }
          return { ...row, timmings: time };
        });

        return res.status(200).json({ success: true, shows: processed });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Movies API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
