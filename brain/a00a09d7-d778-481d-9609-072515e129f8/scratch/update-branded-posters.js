import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function updateBrandedPosters() {
  console.log('--- Updating Branded Event Posters ---');
  
  const updates = [
    {
      name: 'Lollapalooza India',
      url: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&w=1600&q=80',
      desc: 'Experience the global music phenomenon in the heart of Mumbai. High-energy performances, iconic artists, and an unforgettable vibe.'
    },
    {
      name: 'MI vs CSK',
      url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1600&q=80',
      desc: 'The El Clasico of Cricket! Witness the legendary rivalry between Mumbai Indians and Chennai Super Kings live.'
    },
    {
      name: 'Wonderla Amusement Park',
      url: 'https://images.unsplash.com/photo-1549497538-301228c965dd?auto=format&fit=crop&w=1600&q=80',
      desc: 'Thrilling rides, splashy water parks, and endless fun for everyone at Indias favorite amusement park.'
    },
    {
      name: 'Chalta Hai Comedy Night',
      url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1600&q=80',
      desc: 'A night of premium stand-up comedy featuring the best observational humor from top Indian comics.'
    },
    {
      name: 'EDM Pulse 2026',
      url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
      desc: 'Electrifying beats, neon lights, and world-class DJs. Get ready for the high-intensity EDM festival of the year.'
    }
  ];

  try {
    for (const item of updates) {
      await pool.query(
        'UPDATE events SET image_url = $1, description = $2 WHERE event_name = $3',
        [item.url, item.desc, item.name]
      );
      console.log(`✓ Updated poster for: ${item.name}`);
    }
    console.log('--- Database Updates Complete ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating posters:', err);
    process.exit(1);
  }
}

updateBrandedPosters();
