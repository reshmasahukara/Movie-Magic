-- Movie Magic PostgreSQL Schema (Postgres / Neon compatible)

-- 1. Admin Table
CREATE TABLE IF NOT EXISTS admin (
    user_name VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255) NOT NULL
);

-- 2. Customer Table
CREATE TABLE IF NOT EXISTS customer (
    user_id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    contact_no BIGINT
);

-- 3. Movie Table
CREATE TABLE IF NOT EXISTS movie (
    movie_id VARCHAR(255) PRIMARY KEY,
    movie_name VARCHAR(255) NOT NULL,
    movie_rating VARCHAR(50),
    movie_dimensions VARCHAR(50),
    genre VARCHAR(255),
    status VARCHAR(50),
    description TEXT,
    language VARCHAR(100)
);

-- 4. Theater Table
CREATE TABLE IF NOT EXISTS theater (
    theater_id SERIAL PRIMARY KEY,
    theater_name VARCHAR(255) NOT NULL,
    city VARCHAR(255)
);

-- 5. Theater-Movie Mapping (theater1)
CREATE TABLE IF NOT EXISTS theater1 (
    theater_id INTEGER REFERENCES theater(theater_id) ON DELETE CASCADE,
    movie_id VARCHAR(255) REFERENCES movie(movie_id) ON DELETE CASCADE,
    PRIMARY KEY (theater_id, movie_id)
);

-- 6. Shows Table
CREATE TABLE IF NOT EXISTS shows (
    screen_id SERIAL PRIMARY KEY,
    movie_id VARCHAR(255) REFERENCES movie(movie_id) ON DELETE CASCADE,
    theater_id INTEGER REFERENCES theater(theater_id) ON DELETE CASCADE,
    timmings TIME NOT NULL,
    show_date DATE NOT NULL,
    screen_no INTEGER NOT NULL,
    screen_dimensions VARCHAR(50),
    no_of_seats INTEGER DEFAULT 0,
    selected_seats JSONB DEFAULT '[]'::jsonb
);

-- 7. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    screen_id INTEGER REFERENCES shows(screen_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES customer(user_id) ON DELETE CASCADE,
    no_of_seats INTEGER DEFAULT 0,
    selected_seats JSONB DEFAULT '[]'::jsonb,
    price NUMERIC(10, 2) DEFAULT 0.00
);

-- Seed Initial Data (Optional)
-- INSERT INTO admin (user_name, password) VALUES ('admin', 'admin123'); -- Recommend manual hashing with bcrypt later
