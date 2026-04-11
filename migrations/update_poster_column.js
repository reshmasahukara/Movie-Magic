import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function migrate() {
  if (!connectionString) {
    console.error('DATABASE_URL is missing.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Running Migration: Add poster and sync from poster_url...');
    
    // 1. Add 'poster' column if not exists
    await pool.query('ALTER TABLE movie ADD COLUMN IF NOT EXISTS poster VARCHAR(500);');
    
    // 2. Sync data from poster_url to poster
    await pool.query('UPDATE movie SET poster = poster_url WHERE poster IS NULL OR poster = \'\';');
    
    // 3. Update the 5 specific movies with manual URLs
    const manualUpdates = [
      { name: 'RAAKA', url: 'https://media5.bollywoodhungama.in/wp-content/uploads/2026/04/Raaka-322x483.jpg' },
      { name: 'OG', url: 'https://fullyfilmy.in/cdn/shop/files/COLLECTION_PHONE.png?v=1756819764&width=800' },
      { name: 'SPIRIT', url: 'https://cdn.district.in/movies-assets/images/cinema/1Spirit_Gallery-af2129a0-16d4-11f1-8a94-b3907dd8fb01.jpg' },
      { name: 'DRAGON', url: 'https://images.filmibeat.com/img/280x383/popcorn/movie_posters/ntr31-20220520120944-19909.jpg' },
      { name: 'STRANGER THINGS S5', url: 'https://wallpapercave.com/wp/wp11785191.jpg' }
    ];

    for (const item of manualUpdates) {
      await pool.query('UPDATE movie SET poster = $1 WHERE movie_name ILIKE $2', [item.url, `%${item.name}%`]);
    }

    console.log('Migration Completed Successfully!');
    await pool.end();
  } catch (error) {
    console.error('Migration Failed:', error);
    await pool.end();
    process.exit(1);
  }
}

migrate();
