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

async function seed() {
  console.log('--- Seeding New Events ---');
  
  try {
    const events = [
      {
        name: 'MI vs CSK',
        cat: 'Sports',
        city: 'Mumbai',
        venue: 'Wankhede Stadium',
        date: '2026-05-16',
        time: '07:30 PM',
        price: 999,
        img: 'https://i.pinimg.com/originals/52/7c/0c/527c0c75cc832ff98d2a3c9ff902ddc6.jpg',
        desc: 'The greatest rivalry in cricket history! Mumbai Indians take on Chennai Super Kings in a high-octane clash at Wankhede.'
      },
      {
        name: 'Wonderla Amusement Park',
        cat: 'Outdoor',
        city: 'Bengaluru',
        venue: 'Wonderla Bengaluru',
        date: '2026-05-24',
        time: '10:00 AM',
        price: 1499,
        img: 'https://i.pinimg.com/originals/be/53/74/be53745621b23ab86399d7c0d8b03aaf.jpg',
        desc: 'A full day of thrills, spills, and splashes! Enjoy over 60 rides and a world-class water park.'
      },
      {
        name: 'Chalta Hai Comedy',
        cat: 'Comedy',
        city: 'Hyderabad',
        venue: 'Shilpakala Vedika',
        date: '2026-05-29',
        time: '08:00 PM',
        price: 499,
        img: 'https://m.media-amazon.com/images/I/71MTDZktU9L.jpg',
        desc: 'Get ready for a night of non-stop laughter with India finest stand-up comedians.'
      }
    ];

    for (const ev of events) {
      await pool.query(`
        INSERT INTO events (event_name, category, city, venue, event_date, event_time, price, total_seats, image_url, description, has_seat_map)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
      `, [ev.name, ev.cat, ev.city, ev.venue, ev.date, ev.time, ev.price, 500, ev.img, ev.desc, false]);
      console.log(`✓ Added ${ev.name}`);
    }

    console.log('--- Seeding Complete ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Failed:', err);
    process.exit(1);
  }
}

seed();
