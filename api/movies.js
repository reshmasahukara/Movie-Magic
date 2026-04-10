import db from './db.js';

export default async function handler(req, res) {
  try {
    const { method, query: q } = req;

    if (method === 'GET') {
      // 1. Fetch Movies (Catalog)
      if (q.action === 'moviesdash' || !q.action) {
        const result = await db.query('SELECT * FROM movie');
        return res.status(200).json({ success: true, movies: result.rows });
      }

      // 2. Fetch User Profile
      if (q.action === 'profile') {
        const userid = q.userid;
        if (!userid) return res.status(400).json({ error: "userid is required" });
        const result = await db.query('SELECT * FROM customer WHERE user_id = $1', [userid]);
        return res.status(200).json({ success: true, user: result.rows[0] });
      }
    }

    if (method === 'POST') {
      // 3. Fetch Theater & Show Details
      const { movieId } = req.body;
      if (!movieId) return res.status(400).json({ error: "movieId is required" });

      const theaters = await db.query(
        'SELECT t.* FROM theater t JOIN theater1 t1 ON t.theater_id = t1.theater_id WHERE t1.movie_id = $1',
        [movieId]
      );
      const shows = await db.query('SELECT * FROM shows WHERE movie_id = $1', [movieId]);
      
      return res.status(200).json({ 
        success: true, 
        theaters: theaters.rows, 
        shows: shows.rows 
      });
    }

    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error('Movies API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
