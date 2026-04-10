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

    // 1. Tables Creation
    console.log("Creating tables...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin (user_name VARCHAR(255) PRIMARY KEY, password VARCHAR(255) NOT NULL);
      CREATE TABLE IF NOT EXISTS customer (user_id INTEGER PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, city VARCHAR(255), contact_no BIGINT);
      CREATE TABLE IF NOT EXISTS movie (movie_id VARCHAR(255) PRIMARY KEY, movie_name VARCHAR(255) NOT NULL, movie_rating VARCHAR(50), movie_dimensions VARCHAR(50), genre VARCHAR(255), status VARCHAR(50), description TEXT, language VARCHAR(100));
      CREATE TABLE IF NOT EXISTS theater (theater_id SERIAL PRIMARY KEY, theater_name VARCHAR(255) NOT NULL, city VARCHAR(255));
      CREATE TABLE IF NOT EXISTS theater1 (theater_id INTEGER REFERENCES theater(theater_id) ON DELETE CASCADE, movie_id VARCHAR(255) REFERENCES movie(movie_id) ON DELETE CASCADE, PRIMARY KEY (theater_id, movie_id));
      CREATE TABLE IF NOT EXISTS shows (screen_id SERIAL PRIMARY KEY, movie_id VARCHAR(255) REFERENCES movie(movie_id) ON DELETE CASCADE, theater_id INTEGER REFERENCES theater(theater_id) ON DELETE CASCADE, timmings TIME NOT NULL, show_date DATE NOT NULL, screen_no INTEGER NOT NULL, screen_dimensions VARCHAR(50), no_of_seats INTEGER DEFAULT 0, selected_seats JSONB DEFAULT '[]'::jsonb);
      CREATE TABLE IF NOT EXISTS bookings (id SERIAL PRIMARY KEY, screen_id INTEGER REFERENCES shows(screen_id) ON DELETE CASCADE, user_id INTEGER REFERENCES customer(user_id) ON DELETE CASCADE, no_of_seats INTEGER DEFAULT 0, selected_seats JSONB DEFAULT '[]'::jsonb, price NUMERIC(10, 2) DEFAULT 0.00, status VARCHAR(50) DEFAULT 'PENDING', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS payments (id SERIAL PRIMARY KEY, booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE, amount NUMERIC(10, 2) NOT NULL, status VARCHAR(50) DEFAULT 'SUCCESS', transaction_id VARCHAR(255), payment_method VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
    `);

    // 2. Clear existing dynamic data (for fresh start)
    console.log("Clearing old show data...");
    await client.query("DELETE FROM shows; DELETE FROM theater1; DELETE FROM theater; DELETE FROM movie;");

    // 3. Seed Movies
    console.log("Seeding movies...");
    await client.query(`
      INSERT INTO movie (movie_id, movie_name, movie_rating, movie_dimensions, genre, status, description, language) VALUES 
      ('M001', 'Inception', '8.8', '2D/IMAX', 'Sci-Fi', 'Running', 'A thief who steals corporate secrets.', 'English'),
      ('M002', 'Interstellar', '8.7', '4DX', 'Adventure', 'Running', 'A team of explorers travel through a wormhole.', 'English'),
      ('M003', 'The Dark Knight', '9.0', '2D', 'Action', 'Running', 'When the menace known as the Joker wreaks havoc.', 'English')
      ON CONFLICT DO NOTHING;
    `);

    // 4. Seed Theaters
    console.log("Seeding theaters...");
    await client.query(`
      INSERT INTO theater (theater_name, city) VALUES 
      ('Cinépolis Luxury', 'New York'),
      ('Galaxy IMAX', 'Los Angeles'),
      ('Regal Cinemas', 'Chicago'),
      ('AMC Empire', 'Miami')
      RETURNING theater_id;
    `);

    // 5. Seed Shows & Mapping
    // (We'll assume IDs 1, 2, 3, 4 for the newly inserted theaters)
    console.log("Seeding shows...");
    await client.query(`
      INSERT INTO theater1 (theater_id, movie_id) VALUES 
      (1, 'M001'), (2, 'M001'), (3, 'M001'),
      (1, 'M002'), (4, 'M002'),
      (2, 'M003'), (3, 'M003'), (4, 'M003');

      INSERT INTO shows (movie_id, theater_id, timmings, show_date, screen_no, screen_dimensions, no_of_seats) VALUES 
      ('M001', 1, '10:30:00', '2026-05-15', 1, 'Gold Class', 60),
      ('M001', 1, '14:00:00', '2026-05-15', 1, 'Gold Class', 60),
      ('M001', 2, '18:00:00', '2026-05-15', 5, 'IMAX 3D', 200),
      ('M002', 4, '19:00:00', '2026-05-15', 8, '4DX', 120),
      ('M003', 2, '20:00:00', '2026-05-15', 3, 'Standard', 150);
    `);

    console.log("\x1b[32m%s\x1b[0m", "Database successfully updated with tables and shows!");
  } catch (err) {
    console.error("Seeding failed:", err.message);
  } finally {
    await client.end();
  }
}

seed();
