import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://neondb_owner:npg_uzrBj3tY5LAH@ep-floral-darkness-a1eb57fe-pooler.ap-southeast-1.aws.neon.tech/Movie-Magic?sslmode=require&channel_binding=require";

async function seed() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to Neon PostgreSQL");

    // 1. Wipe old data
    console.log("Cleaning old data...");
    await client.query("DELETE FROM shows; DELETE FROM theater1; DELETE FROM theater; DELETE FROM movie;");

    // 2. Insert New Movies
    console.log("Inserting new movies: RAAKA, OG, SPIRIT, VARANASI...");
    await client.query(`
      INSERT INTO movie (movie_id, movie_name, movie_rating, movie_dimensions, genre, status, description, language) VALUES 
      ('M001', 'RAAKA', '9.2', 'IMAX 3D', 'Action/Thriller', 'Coming Soon', 'A high-octane action epic.', 'Telugu/Hindi'),
      ('M002', 'OG', '9.5', '2D/4DX', 'Gangster Drama', 'Running', 'The original gangster returns to reclaim his throne.', 'Telugu'),
      ('M003', 'SPIRIT', '9.0', '2D', 'Crime/Action', 'In Production', 'A gripping police procedural drama.', 'Multi-Language'),
      ('M004', 'VARANASI', '8.8', 'Standard', 'Spiritual/Drama', 'Now Showing', 'A journey of self-discovery in the holy city.', 'Hindi');
    `);

    // 3. Insert New Theaters
    console.log("Inserting theaters: Cinepolis Nexus, INOX...");
    const tResult = await client.query(`
      INSERT INTO theater (theater_name, city) VALUES 
      ('Cinepolis Nexus', 'Hyderabad'),
      ('INOX', 'Hyderabad')
      RETURNING theater_id, theater_name;
    `);
    
    const theaters = tResult.rows;
    const nexusId = theaters.find(t => t.theater_name === 'Cinepolis Nexus').theater_id;
    const inoxId = theaters.find(t => t.theater_name === 'INOX').theater_id;

    // 4. Map Movies to Theaters
    console.log("Mapping movies to theaters...");
    await client.query(`
      INSERT INTO theater1 (theater_id, movie_id) VALUES 
      (${nexusId}, 'M001'), (${inoxId}, 'M002'), 
      (${nexusId}, 'M003'), (${inoxId}, 'M004');
    `);

    // 5. Add Show Schedules
    console.log("Creating schedules...");
    await client.query(`
      INSERT INTO shows (movie_id, theater_id, timmings, show_date, screen_no, screen_dimensions, no_of_seats) VALUES 
      -- RAAKA shows
      ('M001', ${nexusId}, '10:00:00', '2026-05-20', 1, 'IMAX', 100),
      ('M001', ${nexusId}, '13:00:00', '2026-05-20', 1, 'IMAX', 100),
      ('M001', ${nexusId}, '18:00:00', '2026-05-20', 1, 'IMAX', 100),
      
      -- OG shows
      ('M002', ${inoxId}, '11:00:00', '2026-05-20', 2, '4DX', 150),
      ('M002', ${inoxId}, '15:00:00', '2026-05-20', 2, '4DX', 150),
      ('M002', ${inoxId}, '20:00:00', '2026-05-20', 2, '4DX', 150),

      -- SPIRIT shows
      ('M003', ${nexusId}, '09:00:00', '2026-05-21', 3, 'Standard', 120),
      ('M003', ${nexusId}, '14:00:00', '2026-05-21', 3, 'Standard', 120),

      -- VARANASI shows
      ('M004', ${inoxId}, '12:00:00', '2026-05-21', 4, 'Standard', 80),
      ('M004', ${inoxId}, '17:00:00', '2026-05-21', 4, 'Standard', 80);
    `);

    console.log("\x1b[32m%s\x1b[0m", "Database successfully updated with RAAKA, OG, SPIRIT, and VARANASI!");
  } catch (err) {
    console.error("Seeding failed:", err.message);
  } finally {
    await client.end();
  }
}

seed();
