import { query } from './api/lib/db.js';

async function debug() {
  console.log('--- DEEP API DEBUG ---');
  const movieId = 'M001';
  const city = 'Kochi';
  
  // 1. Check Movie
  const m = await query("SELECT * FROM movie WHERE movie_id = $1", [movieId]);
  console.log('Movie exists:', m.rows.length > 0 ? 'YES' : 'NO');
  
  // 2. Check Theater in Kochi
  const t = await query("SELECT * FROM theater WHERE city = $1", [city]);
  console.log('Theaters in Kochi:', t.rows.length);
  if (t.rows.length > 0) t.rows.forEach(r => console.log(`  - ${r.theater_id}: ${r.theater_name}`));

  // 3. Check Shows for M001 globally
  const sGlobal = await query("SELECT count(*) FROM shows WHERE movie_id = $1", [movieId]);
  console.log(`Global shows for ${movieId}:`, sGlobal.rows[0].count);

  // 4. Check Shows for M001 in Kochi
  const sk = await query(`
    SELECT s.*, t.theater_name, t.city 
    FROM shows s 
    JOIN theater t ON s.theater_id = t.theater_id 
    WHERE s.movie_id = $1 AND t.city = $2
  `, [movieId, city]);
  console.log(`Direct Kochi shows for ${movieId}:`, sk.rows.length);

  // 5. Check if they are expired
  if (sk.rows.length > 0) {
    console.log('Sample show date:', sk.rows[0].show_date, 'Current Date:', new Date().toISOString());
  }

  // 6. Check for ID variation (numeric 1)
  const s1 = await query("SELECT count(*) FROM shows WHERE movie_id = '1'");
  console.log('Shows for movie_id="1":', s1.rows[0].count);

}

debug();
