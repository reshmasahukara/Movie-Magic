-- Movie Magic PostgreSQL Schema (Postgres / Neon compatible)

-- 1. Admin Table
CREATE TABLE IF NOT EXISTS admin (
    user_name VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255) NOT NULL
);

-- 2. Customer Table
CREATE TABLE IF NOT EXISTS customer (
    user_id SERIAL PRIMARY KEY,
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
    language VARCHAR(100),
    category VARCHAR(100),
    duration VARCHAR(50),
    poster VARCHAR(500)
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
    screen_id VARCHAR(255) PRIMARY KEY,
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
    screen_id VARCHAR(255) REFERENCES shows(screen_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES customer(user_id) ON DELETE CASCADE,
    no_of_seats INTEGER DEFAULT 0,
    selected_seats JSONB DEFAULT '[]'::jsonb,
    price NUMERIC(10, 2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'Paid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'SUCCESS',
    transaction_id VARCHAR(255),
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Data
INSERT INTO admin (user_name, password) VALUES ('admin', '$2b$10$Ex7a3U/6v6k.6hMv3I5BieH2h9lF5Y.Uu/K8b6VjJvUuJ/v8v5q/m'); -- admin123 hashed

INSERT INTO movie (movie_id, movie_name, movie_rating, movie_dimensions, genre, status, description, language) VALUES 
('M001', 'RAAKA', '9.2', 'IMAX 3D', 'Action/Thriller', 'Coming Soon', 'A high-octane action epic.', 'Telugu/Hindi'),
('M002', 'OG', '9.5', '2D/4DX', 'Gangster Drama', 'Running', 'The original gangster returns to reclaim his throne.', 'Telugu'),
('M003', 'SPIRIT', '9.0', '2D', 'Crime/Action', 'In Production', 'A gripping police procedural drama.', 'Multi-Language'),
('M004', 'VARANASI', '8.8', 'Standard', 'Spiritual/Drama', 'Now Showing', 'A journey of self-discovery in the holy city.', 'Hindi')
ON CONFLICT (movie_id) DO NOTHING;

INSERT INTO theater (theater_name, city) VALUES 
('Cinepolis Nexus', 'Hyderabad'),
('INOX', 'Hyderabad')
ON CONFLICT (theater_id) DO NOTHING;

-- Map movies to theaters and add shows via seed.js for dynamic ID handling.
