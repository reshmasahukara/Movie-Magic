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

    // 1. Ensure Table Structure with missing columns
    console.log("Updating table structure...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin (user_name VARCHAR(255) PRIMARY KEY, password VARCHAR(255) NOT NULL);
      CREATE TABLE IF NOT EXISTS customer (user_id INTEGER PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, city VARCHAR(255), contact_no BIGINT);
      CREATE TABLE IF NOT EXISTS movie (movie_id VARCHAR(255) PRIMARY KEY, movie_name VARCHAR(255) NOT NULL, movie_rating VARCHAR(50), movie_dimensions VARCHAR(50), genre VARCHAR(255), status VARCHAR(50), description TEXT, language VARCHAR(100));
      CREATE TABLE IF NOT EXISTS theater (theater_id SERIAL PRIMARY KEY, theater_name VARCHAR(255) NOT NULL, city VARCHAR(255));
      CREATE TABLE IF NOT EXISTS theater1 (theater_id INTEGER REFERENCES theater(theater_id) ON DELETE CASCADE, movie_id VARCHAR(255) REFERENCES movie(movie_id) ON DELETE CASCADE, PRIMARY KEY (theater_id, movie_id));
      CREATE TABLE IF NOT EXISTS shows (screen_id SERIAL PRIMARY KEY, movie_id VARCHAR(255) REFERENCES movie(movie_id) ON DELETE CASCADE, theater_id INTEGER REFERENCES theater(theater_id) ON DELETE CASCADE, timmings TIME NOT NULL, show_date DATE NOT NULL, screen_no INTEGER NOT NULL, screen_dimensions VARCHAR(50), no_of_seats INTEGER DEFAULT 0, selected_seats JSONB DEFAULT '[]'::jsonb);
      
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY, 
        screen_id INTEGER REFERENCES shows(screen_id) ON DELETE CASCADE, 
        user_id INTEGER REFERENCES customer(user_id) ON DELETE CASCADE, 
        no_of_seats INTEGER DEFAULT 0, 
        selected_seats JSONB DEFAULT '[]'::jsonb, 
        price NUMERIC(10, 2) DEFAULT 0.00, 
        payment_status VARCHAR(50) DEFAULT 'Paid', 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payments (id SERIAL PRIMARY KEY, booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE, amount NUMERIC(10, 2) NOT NULL, status VARCHAR(50) DEFAULT 'SUCCESS', transaction_id VARCHAR(255), payment_method VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
    `);

    // Ensure columns exist if table was already there
    await client.query(`
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'Paid';
    `);

    // 2. Wipe dynamic data for fresh seed
    console.log("Cleaning old show data...");
    await client.query("DELETE FROM shows; DELETE FROM theater1; DELETE FROM theater; DELETE FROM movie;");

    // 3. Insert Movies
    await client.query(`
      INSERT INTO movie (movie_id, movie_name, movie_rating, movie_dimensions, genre, status, description, language) VALUES 
      ('M001', 'RAAKA', '9.2', 'IMAX 3D', 'Action/Thriller', 'Coming Soon', 'A high-octane action epic.', 'Telugu/Hindi'),
      ('M002', 'OG', '9.5', '2D/4DX', 'Gangster Drama', 'Running', 'The original gangster returns.', 'Telugu'),
      ('M003', 'SPIRIT', '9.0', '2D', 'Crime/Action', 'In Production', 'A police procedural drama.', 'Multi-Language'),
      ('M004', 'VARANASI', '8.8', 'Standard', 'Spiritual/Drama', 'Now Showing', 'A journey of self-discovery.', 'Hindi');
    `);

    // 4. Insert Theaters
    const tResult = await client.query(`
      INSERT INTO theater (theater_name, city) VALUES 
      ('Cinepolis Nexus', 'Hyderabad'), ('INOX', 'Hyderabad')
      RETURNING theater_id, theater_name;
    `);
    
    const nexusId = tResult.rows.find(t => t.theater_name === 'Cinepolis Nexus').theater_id;
    const inoxId = tResult.rows.find(t => t.theater_name === 'INOX').theater_id;

    // 5. Build Schedules
    await client.query(`
      INSERT INTO theater1 (theater_id, movie_id) VALUES 
      (${nexusId}, 'M001'), (${inoxId}, 'M002'), (${nexusId}, 'M003'), (${inoxId}, 'M004');

      INSERT INTO shows (movie_id, theater_id, timmings, show_date, screen_no, screen_dimensions, no_of_seats) VALUES 
      ('M001', ${nexusId}, '10:00:00', '2026-05-20', 1, 'IMAX', 100),
      ('M002', ${inoxId}, '11:00:00', '2026-05-20', 2, '4DX', 150);
    `);

    console.log("\x1b[32m%s\x1b[0m", "Database Schema & Data fully updated!");
  } catch (err) {
    console.error("Seeding failed:", err.message);
  } finally {
    await client.end();
  }
}

seed();
