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
    price NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PAID, FAILED
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
('M001', 'Inception', '8.8', '2D/IMAX', 'Sci-Fi', 'Running', 'A thief who steals corporate secrets through the use of dream-sharing technology.', 'English'),
('M002', 'Interstellar', '8.7', '4DX', 'Adventure', 'Running', 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.', 'English'),
('M003', 'The Dark Knight', '9.0', '2D', 'Action', 'Running', 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham.', 'English')
ON CONFLICT (movie_id) DO NOTHING;

INSERT INTO theater (theater_name, city) VALUES 
('Cinema Magic', 'Mumbai'),
('Galaxy IMAX', 'Bangalore')
ON CONFLICT (theater_id) DO NOTHING;

INSERT INTO theater1 (theater_id, movie_id) VALUES (1, 'M001'), (2, 'M002'), (1, 'M003') ON CONFLICT DO NOTHING;

INSERT INTO shows (movie_id, theater_id, timmings, show_date, screen_no, screen_dimensions, no_of_seats) VALUES 
('M001', 1, '18:00:00', '2026-05-10', 1, 'Standard', 100),
('M002', 2, '21:00:00', '2026-05-11', 2, 'IMAX', 150)
ON CONFLICT (screen_id) DO NOTHING;
