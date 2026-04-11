import { query } from './db.js';

export default async function handler(req, res) {
  try {
    const { method, query: q, body } = req;

    // 1. FETCH MOVIE CATALOG (Default action for homepage)
    if (method === 'GET' && (q.action === 'moviesdash' || !q.action)) {
      let moviesQuery;
      let params = [];
      
      // LOGIC: Deduplicate movies and prioritize shows in selected city OR 'Coming Soon' status
      if (q.city && q.city !== 'all') {
        moviesQuery = `
          SELECT DISTINCT ON (m.movie_id) m.* 
          FROM movie m
          LEFT JOIN shows s ON m.movie_id = s.movie_id
          LEFT JOIN theater t ON s.theater_id = t.theater_id
          WHERE (t.city = $1 OR m.status = 'Coming Soon')
          ORDER BY m.movie_id, 
                   CASE WHEN m.status = 'Now Showing' THEN 1 ELSE 2 END,
                   m.movie_name ASC
        `;
        params = [q.city];
      } else {
        // Global list deduplicated and sorted
        moviesQuery = `
          SELECT DISTINCT ON (m.movie_id) m.* 
          FROM movie m
          ORDER BY m.movie_id, 
                   CASE WHEN m.status = 'Now Showing' THEN 1 ELSE 2 END,
                   m.movie_name ASC
        `;
      }

      const result = await query(moviesQuery, params);
      
      // Final re-sort to ensure correct grouping at top level after DISTINCT ON (which requires ORDER BY primary key first)
      const sortedMovies = result.rows.sort((a, b) => {
        const order = { 'Now Showing': 1, 'Coming Soon': 2 };
        const statusDiff = (order[a.status] || 99) - (order[b.status] || 99);
        return statusDiff === 0 ? a.movie_name.localeCompare(b.movie_name) : statusDiff;
      });

      return res.status(200).json({ success: true, movies: sortedMovies });
    }

    // 2. FETCH USER PROFILE
    if (method === 'GET' && q.action === 'profile') {
      const userid = q.userid;
      if (!userid) return res.status(400).json({ error: "userid is required" });
      
      const result = await query('SELECT * FROM customer WHERE user_id = $1', [userid]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User session expired or not found" });
      }
      
      return res.status(200).json({ success: true, user: result.rows[0] });
    }

    // 3. FETCH MOVIE DETAILS (Theaters + Shows)
    if (method === 'POST') {
      const { movieId } = body;
      if (!movieId) return res.status(400).json({ error: "movieId is required" });

      try {
        // Direct JOIN between theater and shows (bypass theater1)
        const theatersResult = await query(
          `SELECT DISTINCT t.* 
           FROM theater t 
           JOIN shows s ON t.theater_id = s.theater_id 
           WHERE s.movie_id = $1`,
          [movieId]
        );

        // Fetch only valid current/future shows
        const showsResult = await query(
          `SELECT * FROM shows 
           WHERE movie_id = $1 
           AND show_date >= CURRENT_DATE 
           ORDER BY show_date ASC, timmings ASC`,
          [movieId]
        );

        return res.status(200).json({ 
          success: true, 
          theaters: theatersResult.rows || [], 
          shows: showsResult.rows || [] 
        });
      } catch (err) {
        // Resilience: return empty arrays instead of failing the request
        console.error('Partial lookup failure:', err.message);
        return res.status(200).json({ success: true, theaters: [], shows: [] });
      }
    }

    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error('Movies API Logic Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
