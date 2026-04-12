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
  console.log('--- Phase 2: System Hardening (Events) ---');
  
  try {
    // 1. Clear existing generic events to avoid duplicates but keep specific IDs if needed
    // For this task, we will just use UPSERT (ON CONFLICT DO UPDATE)
    
    const events = [
      // SPORTS
      {
        name: 'MI vs CSK',
        cat: 'Sports',
        city: 'Mumbai',
        venue: 'Wankhede Stadium',
        date: '2026-05-16',
        time: '07:30 PM',
        price: 999,
        img: 'https://i.pinimg.com/videos/thumbnails/originals/a0/8f/e0/a08fe047f55493fbca44602ddc5cee5e.0000000.jpg',
        desc: 'The ultimate rivalry in cricket! Watch Mumbai Indians battle Chennai Super Kings live at the iconic Wankhede.'
      },
      {
        name: 'ISL Final 2026',
        cat: 'Sports',
        city: 'Kolkata',
        venue: 'Salt Lake Stadium',
        date: '2026-05-30',
        time: '07:00 PM',
        price: 499,
        img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800',
        desc: 'Experience the thrill of the Indian Super League final. India finest football talent competing for the crown.'
      },
      {
        name: 'Pro Kabaddi Grand Finale',
        cat: 'Sports',
        city: 'Hyderabad',
        venue: 'Gachibowli Stadium',
        date: '2026-06-05',
        time: '08:00 PM',
        price: 299,
        img: 'https://img.etimg.com/thumb/msid-66044717,width-640,resizemode-4,imgsize-150244/pro-kabaddi-league.jpg',
        desc: 'Le Panga! The high-intensity Kabaddi season concludes with an epic final showdown.'
      },
      
      // COMEDY
      {
        name: 'Zakir Khan: Tathastu Tour',
        cat: 'Comedy',
        city: 'Mumbai',
        venue: 'Shanmukhananda Hall',
        date: '2026-05-20',
        time: '08:00 PM',
        price: 1200,
        img: 'https://m.media-amazon.com/images/I/71R3yX-S1JL._RI_.jpg',
        desc: 'Zakir Khan returns with his most personal show yet. A night of storytelling and laughs.'
      },
      {
        name: 'Anubhav Bassi: Bas Kar Bassi',
        cat: 'Comedy',
        city: 'Delhi',
        venue: 'Talkatora Stadium',
        date: '2026-06-12',
        time: '07:00 PM',
        price: 999,
        img: 'https://in.bmscdn.com/events/moviecard/ET00311497.jpg',
        desc: 'Join Bassi as he takes you through his journey of failures and funny anecdotes.'
      },
      {
        name: 'Chalta Hai Comedy Night',
        cat: 'Comedy',
        city: 'Hyderabad',
        venue: 'Shilpakala Vedika',
        date: '2026-05-29',
        time: '08:00 PM',
        price: 499,
        img: 'https://m.media-amazon.com/images/I/71MTDZktU9L.jpg',
        desc: 'Multiple acts, one stage, infinite laughs. The best of Hyderabad stand-up scene.'
      },

      // OUTDOOR
      {
        name: 'Wonderla Amusement Park',
        cat: 'Outdoor',
        city: 'Bengaluru',
        venue: 'Wonderla Bengaluru',
        date: '2026-05-24',
        time: '11:00 AM',
        price: 1499,
        img: 'https://i.pinimg.com/originals/be/53/74/be53745621b23ab86399d7c0d8b03aaf.jpg',
        desc: 'World-class rides and water park thrills for the entire family.'
      },
      {
        name: 'Scuba Diving Adventure',
        cat: 'Outdoor',
        city: 'Mumbai',
        venue: 'Malvan Coast',
        date: '2026-05-25',
        time: '06:00 AM',
        price: 2500,
        img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800',
        desc: 'Explore the marine life of the Konkan coast with certified instructors.'
      },
      {
        name: 'Trekking at Kalsubai',
        cat: 'Outdoor',
        city: 'Pune',
        venue: 'Bari Village',
        date: '2026-06-14',
        time: '04:00 AM',
        price: 800,
        img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800',
        desc: 'Conquer the highest peak of Maharashtra! An exhilarating night trek with sunrise views.'
      },

      // FESTIVAL
      {
        name: 'Sunburn Festival 2026',
        cat: 'Festival',
        city: 'Goa',
        venue: 'Vagator Beach',
        date: '2026-12-28',
        time: '02:00 PM',
        price: 5000,
        img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800',
        desc: 'Asias biggest music festival is back! Dance to the beats of top international DJs.'
      },
      {
        name: 'NH7 Weekender',
        cat: 'Festival',
        city: 'Pune',
        venue: 'Mahalakshmi Lawns',
        date: '2026-11-15',
        time: '03:00 PM',
        price: 3500,
        img: 'https://pbs.twimg.com/media/FipqR7FX0AIg_2b.jpg',
        desc: 'The happiest music festival. Indie artists, great food, and amazing vibes.'
      },
      {
        name: 'Lollapalooza India',
        cat: 'Festival',
        city: 'Mumbai',
        venue: 'Mahalaxmi Race Course',
        date: '2026-01-28',
        time: '12:00 PM',
        price: 8000,
        img: 'https://images.lifestyleasia.com/wp-content/uploads/sites/7/2022/07/28164052/lolla.jpg',
        desc: 'The global phenomenon returns to Mumbai with a massive multi-genre lineup.'
      },

      // WORKSHOPS
      {
        name: 'Mastering Pottery',
        cat: 'Workshops',
        city: 'Mumbai',
        venue: 'The Art Studio',
        date: '2026-05-18',
        time: '10:00 AM',
        price: 1500,
        img: 'https://images.unsplash.com/photo-1565191999001-551c187427bb?auto=format&fit=crop&w=800',
        desc: 'Learn the therapeutic art of wheel pottery from master craftsmen.'
      },
      {
        name: 'AI & Data Science Bootcamp',
        cat: 'Workshops',
        city: 'Bengaluru',
        venue: 'Tech Park',
        date: '2026-06-01',
        time: '09:00 AM',
        price: 2000,
        img: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&w=800',
        desc: 'Accelerate your career with our hands-on AI and Machine Learning intensive.'
      },
      {
        name: 'Photography Masterclass',
        cat: 'Workshops',
        city: 'Delhi',
        venue: 'Lodhi Garden',
        date: '2026-05-22',
        time: '06:30 AM',
        price: 1200,
        img: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800',
        desc: 'Master the rules of composition and lighting in this practical outdoor workshop.'
      }
    ];

    for (const ev of events) {
      // Check if event already exists by name
      const existing = await pool.query('SELECT id FROM events WHERE event_name = $1', [ev.name]);
      
      if (existing.rows.length > 0) {
        await pool.query(`
          UPDATE events SET 
            category = $1, city = $2, venue = $3, event_date = $4, 
            event_time = $5, price = $6, image_url = $7, description = $8
          WHERE event_name = $9
        `, [ev.cat, ev.city, ev.venue, ev.date, ev.time, ev.price, ev.img, ev.desc, ev.name]);
        console.log(`✓ Updated ${ev.name}`);
      } else {
        await pool.query(`
          INSERT INTO events (event_name, category, city, venue, event_date, event_time, price, total_seats, image_url, description, has_seat_map)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [ev.name, ev.cat, ev.city, ev.venue, ev.date, ev.time, ev.price, 500, ev.img, ev.desc, ev.cat === 'Workshops']); // Seat map for workshops
        console.log(`+ Added ${ev.name}`);
      }
    }

    console.log('--- Seeding Complete ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Failed:', err);
    process.exit(1);
  }
}

seed();
