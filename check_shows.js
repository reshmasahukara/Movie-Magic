import { query } from './api/lib/db.js';

async function check() {
  const movieId = 'M001';
  const city = 'Kochi';
  const today = '2026-04-13';

  console.log(`Checking shows for ${movieId} in ${city} on ${today}...`);

  try {
    const res = await query(`
      SELECT s.*, t.theater_name, t.city 
      FROM shows s 
      JOIN theater t ON s.theater_id = t.theater_id 
      WHERE (s.movie_id = $1 OR s.movie_id = '1')
      AND t.city = $2
    `, [movieId, city]);

    console.log(`Found ${res.rows.length} shows.`);
    if (res.rows.length > 0) {
       console.log('Sample show:', res.rows[0]);
    }

    const dateRes = await query('SELECT DISTINCT show_date FROM shows ORDER BY show_date');
    console.log('Available dates in DB:', dateRes.rows.map(r => r.show_date));

  } catch (err) {
    console.error(err);
  }
}

check();
