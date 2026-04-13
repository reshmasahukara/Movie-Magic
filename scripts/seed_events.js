import { query } from '../api/lib/db.js';

/**
 * PRODUCTION SEED SCRIPT
 * Adds 60 high-quality unique events across 6 categories.
 * Run with: node scripts/seed_events.js
 */

const events = [
  // MUSIC (10)
  { name: 'Sunburn Beach Festival', cat: 'Music', city: 'Goa', venue: 'Vagator Beach', price: 2999, img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800' },
  { name: 'Arijit Singh Live', cat: 'Music', city: 'Mumbai', venue: 'Jio Gardens', price: 4999, img: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800' },
  { name: 'EDM Paradise Night', cat: 'Music', city: 'Bangalore', venue: 'Whitefield Arena', price: 1500, img: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&w=800' },
  { name: 'Jazzy Evenings', cat: 'Music', city: 'Delhi', venue: 'Blue Bar', price: 1200, img: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800' },
  { name: 'Rock Arena 2026', cat: 'Music', city: 'Pune', venue: 'Phoenix Mall', price: 1800, img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=800' },
  { name: 'Indie Soul Concert', cat: 'Music', city: 'Hyderabad', venue: 'HICC', price: 999, img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800' },
  { name: 'Techno Underground', cat: 'Music', city: 'Mumbai', venue: 'AntiSocial', price: 1100, img: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&w=800' },
  { name: 'Bollywood Mashup', cat: 'Music', city: 'Delhi', venue: 'Talkatora Stadium', price: 1500, img: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&w=800' },
  { name: 'Acoustic Unplugged', cat: 'Music', city: 'Online', venue: 'Streamyard Live', price: 299, img: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800' },
  { name: 'Global Music Fest', cat: 'Music', city: 'Bangalore', venue: 'Palace Grounds', price: 3500, img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800' },

  // SPORTS (10)
  { name: 'IPL: Mumbai vs Chennai', cat: 'Sports', city: 'Mumbai', venue: 'Wankhede Stadium', price: 2500, img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800' },
  { name: 'World Cricket League', cat: 'Sports', city: 'Delhi', venue: 'Arun Jaitley Stadium', price: 1500, img: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800' },
  { name: 'Kabaddi Pro Finals', cat: 'Sports', city: 'Hyderabad', venue: 'Gachibowli Stadium', price: 800, img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800' },
  { name: 'City Marathon 2026', cat: 'Sports', city: 'Mumbai', venue: 'Marine Drive', price: 500, img: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=800' },
  { name: 'Elite Tennis Open', cat: 'Sports', city: 'Chennai', venue: 'SDAT Stadium', price: 1200, img: 'https://images.unsplash.com/photo-1595435064219-510e3a220931?auto=format&fit=crop&w=800' },
  { name: 'Football Pride Cup', cat: 'Sports', city: 'Kolkata', venue: 'Salt Lake Stadium', price: 600, img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800' },
  { name: 'Chess Masterclass', cat: 'Sports', city: 'Online', venue: 'Chess.com', price: 499, img: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800' },
  { name: 'Badminton Pro League', cat: 'Sports', city: 'Bangalore', venue: 'Kanteerava Stadium', price: 700, img: 'https://images.unsplash.com/photo-1626225967041-9642f136612c?auto=format&fit=crop&w=800' },
  { name: 'Basketball Fury', cat: 'Sports', city: 'Pune', venue: 'Balewadi Stadium', price: 900, img: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800' },
  { name: 'Cycling Challenge', cat: 'Sports', city: 'Pune', venue: 'Lonavala Hills', price: 400, img: 'https://images.unsplash.com/photo-1541625602330-2277a1c4b6c3?auto=format&fit=crop&w=800' },

  // COMEDY (10)
  { name: 'Zakir Khan: Tathastu', cat: 'Comedy', city: 'Delhi', venue: 'Indira Gandhi Stadium', price: 1999, img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800' },
  { name: 'Standup Sunday Night', cat: 'Comedy', city: 'Mumbai', venue: 'Canvas Comedy', price: 799, img: 'https://images.unsplash.com/photo-1485872299829-c673f5194813?auto=format&fit=crop&w=800' },
  { name: 'Comic Riot Live', cat: 'Comedy', city: 'Bangalore', venue: 'Good Vibes Cafe', price: 600, img: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=800' },
  { name: 'Comedy Carnival', cat: 'Comedy', city: 'Pune', venue: 'Classic Rock', price: 850, img: 'https://images.unsplash.com/photo-1543584730-05c42d672727?auto=format&fit=crop&w=800' },
  { name: 'Laugh Out Loud Fest', cat: 'Comedy', city: 'Hyderabad', venue: 'Heart Cup', price: 999, img: 'https://images.unsplash.com/photo-1553095066-5014bd70399e?auto=format&fit=crop&w=800' },
  { name: 'Open Mic Special', cat: 'Comedy', city: 'Delhi', venue: 'The Hosteller', price: 200, img: 'https://images.unsplash.com/photo-1525920980468-0657175373ed?auto=format&fit=crop&w=800' },
  { name: 'Sit Down Stand Up', cat: 'Comedy', city: 'Mumbai', venue: 'The Habitat', price: 500, img: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&w=800' },
  { name: 'Comedy Under The Stars', cat: 'Comedy', city: 'Bangalore', venue: 'The Courtyard', price: 700, img: 'https://images.unsplash.com/photo-1496024840928-4c417daf2d1d?auto=format&fit=crop&w=800' },
  { name: 'Bassi Live', cat: 'Comedy', city: 'Delhi', venue: 'Siri Fort', price: 2499, img: 'https://images.unsplash.com/photo-1585699324551-f6c309eedee6?auto=format&fit=crop&w=800' },
  { name: 'Jokes On You', cat: 'Comedy', city: 'Pune', venue: 'The 3 Musketeers', price: 400, img: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=800' },

  // OUTDOOR (10)
  { name: 'Pawna Lake Camping', cat: 'Outdoor', city: 'Pune', venue: 'Pawna Lake', price: 1200, img: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=800' },
  { name: 'Night Trek to Kalsubai', cat: 'Outdoor', city: 'Mumbai', venue: 'Kalsubai Peak', price: 1500, img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800' },
  { name: 'White Water Rafting', cat: 'Outdoor', city: 'Rishikesh', venue: 'Ganga River', price: 2500, img: 'https://images.unsplash.com/photo-1530866495547-08b978d21703?auto=format&fit=crop&w=800' },
  { name: 'Safari Ride: Jim Corbett', cat: 'Outdoor', city: 'Ramnagar', venue: 'National Park', price: 3500, img: 'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=800' },
  { name: 'Stargazing Night', cat: 'Outdoor', city: 'Online', venue: 'Virtual Telescope', price: 199, img: 'https://images.unsplash.com/photo-1516331138075-f391f1443873?auto=format&fit=crop&w=800' },
  { name: 'Beach Yoga Retreat', cat: 'Outdoor', city: 'Goa', venue: 'Palolem Beach', price: 2999, img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800' },
  { name: 'Waterfall Rappelling', cat: 'Outdoor', city: 'Karjat', venue: 'Bhivpuri Fall', price: 1800, img: 'https://images.unsplash.com/photo-1439754389055-9f0855aa82c2?auto=format&fit=crop&w=800' },
  { name: 'Bird Watching Tour', cat: 'Outdoor', city: 'Delhi', venue: 'Okhla Sanctuary', price: 300, img: 'https://images.unsplash.com/photo-1444464666168-49d633b867ad?auto=format&fit=crop&w=800' },
  { name: 'Coastal Cycling', cat: 'Outdoor', city: 'Mumbai', venue: 'Worli Seaface', price: 400, img: 'https://images.unsplash.com/photo-1473876637954-4b493d59fd97?auto=format&fit=crop&w=800' },
  { name: 'Mountain Biking', cat: 'Outdoor', city: 'Manali', venue: 'Solang Valley', price: 2000, img: 'https://images.unsplash.com/photo-1544191696-102dbda3c0b5?auto=format&fit=crop&w=800' },

  // FESTIVALS (10)
  { name: 'Lollapalooza India', cat: 'Festival', city: 'Mumbai', venue: 'Mahalaxmi Racecourse', price: 9999, img: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&w=800' },
  { name: 'NH7 Weekender', cat: 'Festival', city: 'Pune', venue: 'Teerth Fields', price: 4000, img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800' },
  { name: 'Global Food Carnival', cat: 'Festival', city: 'Delhi', venue: 'JLN Stadium', price: 200, img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800' },
  { name: 'Art & Craft Expo', cat: 'Festival', city: 'Bangalore', venue: 'Chitrakala Parishath', price: 100, img: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800' },
  { name: 'Flower Show 2026', cat: 'Festival', city: 'Bangalore', venue: 'Lalbagh Gardens', price: 50, img: 'https://images.unsplash.com/photo-1520333789090-1afc82db536a?auto=format&fit=crop&w=800' },
  { name: 'Cultural Heritage Fest', cat: 'Festival', city: 'Hyderabad', venue: 'Shilparamam', price: 150, img: 'https://images.unsplash.com/photo-1566737236500-c8ac4dc81423?auto=format&fit=crop&w=800' },
  { name: 'Literature Festival', cat: 'Festival', city: 'Jaipur', venue: 'Diggi Palace', price: 0, img: 'https://images.unsplash.com/photo-1491843384429-30494622ea92?auto=format&fit=crop&w=800' },
  { name: 'Wine & Cheese Fest', cat: 'Festival', city: 'Nashik', venue: 'Sula Vineyards', price: 1500, img: 'https://images.unsplash.com/photo-1506377247377-2a5b3b0ca7df?auto=format&fit=crop&w=800' },
  { name: 'Kite Festival Special', cat: 'Festival', city: 'Ahmedabad', venue: 'Riverfront', price: 0, img: 'https://images.unsplash.com/photo-1517022812141-23620dba5c23?auto=format&fit=crop&w=800' },
  { name: 'Gully Food Street', cat: 'Festival', city: 'Mumbai', venue: 'Mohammed Ali Road', price: 0, img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800' },

  // WORKSHOPS (10)
  { name: 'Pottery for Beginners', cat: 'Workshops', city: 'Mumbai', venue: 'Art Village', price: 1200, img: 'https://images.unsplash.com/photo-1565191999001-551c187427bb?auto=format&fit=crop&w=800' },
  { name: 'Photography Bootcamp', cat: 'Workshops', city: 'Delhi', venue: 'Lodi Garden', price: 3500, img: 'https://images.unsplash.com/photo-1452784444945-3f422708fe5e?auto=format&fit=crop&w=800' },
  { name: 'Full Stack Coding', cat: 'Workshops', city: 'Online', venue: 'Zoom Live', price: 15000, img: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800' },
  { name: 'Dance: Salsa Night', cat: 'Workshops', city: 'Bangalore', venue: 'Latin Dance Academy', price: 1000, img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800' },
  { name: 'Yoga & Wellness', cat: 'Workshops', city: 'Pune', venue: 'Yoga Vidya', price: 800, img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800' },
  { name: 'Cooking: Italian Class', cat: 'Workshops', city: 'Mumbai', venue: 'Culinary Craft', price: 2500, img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800' },
  { name: 'Digital Marketing 101', cat: 'Workshops', city: 'Online', venue: 'Google Meet', price: 2999, img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800' },
  { name: 'Painting Workshop', cat: 'Workshops', city: 'Mumbai', venue: 'The Art House', price: 1500, img: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800' },
  { name: 'Writing Masterclass', cat: 'Workshops', city: 'Delhi', venue: 'British Council', price: 1800, img: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800' },
  { name: 'Finance for All', cat: 'Workshops', city: 'Online', venue: 'Simplilearn', price: 4999, img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800' }
];

async function seed() {
  console.log('Starting Seeding Process...');
  try {
    for (const ev of events) {
      const sql = `
        INSERT INTO events (event_name, category, city, venue, event_date, event_time, price, image_url, status, total_seats, has_seat_map)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Active', 100, false)
        ON CONFLICT DO NOTHING
      `;
      const randomDay = Math.floor(Math.random() * 30) + 1;
      const date = \`2026-04-\${randomDay}\`;
      const time = \`\${10 + Math.floor(Math.random() * 8)}:00 PM\`;

      await query(sql, [ev.name, ev.cat, ev.city, ev.venue, date, time, ev.price, ev.img]);
    }
    console.log('Seeding Completed Successfully! 🚀');
    process.exit(0);
  } catch (err) {
    console.error('Seeding Failed:', err);
    process.exit(1);
  }
}

seed();
