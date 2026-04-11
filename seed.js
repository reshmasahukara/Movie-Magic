import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function seed() {
  if (!connectionString) {
    console.error('DATABASE_URL is missing. Please set it in .env');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Starting Standalone Seed Process...');

    // 1. Clear existing data
    await pool.query('TRUNCATE customer, movie, theater, shows, bookings, payments RESTART IDENTITY CASCADE');
    await pool.query('ALTER SEQUENCE shows_screen_id_seq RESTART WITH 1000');
    console.log('Tables truncated.');

    // 2. Seed Movies
    const movies = [
      // Format: [id, name, rating, dimensions, genre, status, description, language, category, duration, poster]
      // Project Specific Manual URLs
      ['M001', 'RAAKA', '9.2', 'IMAX 3D', 'Action/Thriller', 'Coming Soon', 'A high-octane action epic.', 'Telugu/Hindi', 'Tollywood', '155 min', 'https://media5.bollywoodhungama.in/wp-content/uploads/2026/04/Raaka-322x483.jpg'],
      ['M002', 'OG', '9.5', '2D/4DX', 'Gangster Drama', 'Running', 'The original gangster returns to reclaim his throne.', 'Telugu', 'Tollywood', '165 min', 'https://fullyfilmy.in/cdn/shop/files/COLLECTION_PHONE.png?v=1756819764&width=800'],
      ['M003', 'SPIRIT', '9.0', '2D', 'Crime/Action', 'In Production', 'A gripping police procedural drama.', 'Multi-Language', 'Tollywood', '170 min', 'https://cdn.district.in/movies-assets/images/cinema/1Spirit_Gallery-af2129a0-16d4-11f1-8a94-b3907dd8fb01.jpg'],
      ['M004', 'VARANASI', '8.8', 'Standard', 'Spiritual/Drama', 'Now Showing', 'A journey of self-discovery in the holy city.', 'Hindi', 'Bollywood', '140 min', 'https://image.tmdb.org/t/p/w500/nL2g8oV9yei8NWHKAeP2L9WUfyA.jpg'],
      ['M005', 'DRAGON', '8.5', '3D', 'Fantasy/Action', 'Coming Soon', 'A tale of fire and blood.', 'English', 'Hollywood', '135 min', 'https://images.filmibeat.com/img/280x383/popcorn/movie_posters/ntr31-20220520120944-19909.jpg'],
      ['M006', 'PUSHPA THE RULE', '9.8', 'IMAX 2D', 'Action/Drama', 'Running', 'The rule of Pushpa begins.', 'Telugu/Hindi', 'Tollywood', '180 min', 'https://image.tmdb.org/t/p/w500/u9b4v6DxGiETJkxTntEzAprq3t9.jpg'],
      ['M007', 'BAHUBALI 2', '9.9', 'IMAX 4K', 'Epic/Action', 'Running', 'The conclusion to the epic saga.', 'Telugu/Hindi', 'Tollywood', '167 min', 'https://image.tmdb.org/t/p/w500/xqByjvldxtC1v5bF7acUpt0gOc3.jpg'],
      ['M008', 'STRANGER THINGS S5', '9.7', 'Standard', 'Sci-Fi/Horror', 'Coming Soon', 'The final chapter in Hawkins.', 'English', 'Hollywood', '150 min', 'https://wallpapercave.com/wp/wp11785191.jpg'],
      ['M009', 'AVENGERS END GAME', '9.6', 'IMAX 3D', 'Superhero', 'Running', 'The grand finale of the infinity saga.', 'English', 'Hollywood', '181 min', 'https://image.tmdb.org/t/p/w500/2rrLBRKlVJJS0zQ1WVazgNCl4TE.jpg'],
      
      // TOLLYWOOD
      ['MT001', 'Baahubali: The Beginning', '9.5', 'IMAX 2D', 'Epic/Action', 'Running', 'An adventurous man helps his love rescue her mother.', 'Telugu/Hindi', 'Tollywood', '159 min', 'https://image.tmdb.org/t/p/w500/961YqzOswV0X9idmSmeqe9RmYp.jpg'],
      ['MT002', 'RRR', '9.7', 'IMAX 3D', 'Action/Drama', 'Running', 'A tale of two legendary revolutionaries.', 'Telugu/Hindi', 'Tollywood', '187 min', 'https://image.tmdb.org/t/p/w500/ljHw5eIMnki3HekwkKwCCHsRSbH.jpg'],
      ['MT003', 'Kalki 2898 AD', '9.2', 'IMAX 3D', 'Sci-Fi/Epic', 'Now Showing', 'A modern avatar of Vishnu descends to earth.', 'Telugu/Hindi', 'Tollywood', '181 min', 'https://image.tmdb.org/t/p/w500/9r0QqBQsD3G5D7P0YMxg3hkkGpz.jpg'],
      ['MT004', 'Salaar: Part 1', '8.9', '2D/4DX', 'Action/Crime', 'Running', 'A gang leader makes a promise to a dying friend.', 'Telugu/Hindi', 'Tollywood', '175 min', 'https://image.tmdb.org/t/p/w500/mNHdClul57prczb5O0krrzyonnn.jpg'],
      ['MT005', 'Saaho', '8.2', 'IMAX 2D', 'Action/Thriller', 'Running', 'An undercover cop gets embroiled in a battle of criminals.', 'Telugu/Hindi', 'Tollywood', '170 min', 'https://i.redd.it/015f28mt9kdd1.jpeg'],
      ['MT006', 'Devara: Part 1', '9.1', '2D/IMAX', 'Action/Drama', 'Running', 'A man from a coastal area journeys to eliminate evil.', 'Telugu', 'Tollywood', '178 min', 'https://image.tmdb.org/t/p/w500/nkWAw6mDVWh3w7QA3eg0hKcMXWo.jpg'],
      ['MT007', 'Pushpa: The Rise', '9.4', '2D', 'Action/Thriller', 'Running', 'A laborer rises through the ranks of a red sandal smuggling syndicate.', 'Telugu/Hindi', 'Tollywood', '179 min', 'https://image.tmdb.org/t/p/w500/u9b4v6DxGiETJkxTntEzAprq3t9.jpg'],
      
      // BOLLYWOOD
      ["MB001", "Dangal", "9.4", "Standard", "Sports/Drama", "Running", "A former wrestler trains his daughters for the Commonwealth Games.", "Hindi", "Bollywood", "161 min", "https://image.tmdb.org/t/p/w500/1xoavuB5bO92wo3eFQjZN2I9ptV.jpg"],
      ["MB002", "Jawan", "9.3", "IMAX 2D", "Action/Thriller", "Running", "A man is driven by a personal vendetta to rectify the wrongs in society.", "Hindi", "Bollywood", "169 min", "https://image.tmdb.org/t/p/w500/bMISXhkBDll6JPsevdJJ1ItnW6S.jpg"],
      ["MB003", "Pathaan", "9.1", "IMAX 2D", "Action/Thriller", "Running", "An Indian secret agent fights a terrorist group.", "Hindi", "Bollywood", "146 min", "https://image.tmdb.org/t/p/w500/juJ8m4zrZ4xjKjRNapQJjDwNXMz.jpg"],
      ["MB004", "Bajrangi Bhaijaan", "9.2", "Standard", "Comedy/Drama", "Running", "A man with a magnanimous heart takes a mute girl back to her homeland.", "Hindi", "Bollywood", "163 min", "https://image.tmdb.org/t/p/w500/nL2g8oV9yei8NWHKAeP2L9WUfyA.jpg"],
      ["MB005", "Animal", "8.8", "Standard", "Action/Drama", "Running", "A son's transition to a violent criminal out of obsession for his father.", "Hindi", "Bollywood", "201 min", "https://image.tmdb.org/t/p/w500/hr9rjR3J0xBBKmlJ4n3gHId9ccx.jpg"],
      ["MB006", "PK", "9.3", "Standard", "Comedy/Sci-Fi", "Running", "An alien on Earth loses his communication device.", "Hindi", "Bollywood", "153 min", "https://image.tmdb.org/t/p/w500/nL2g8oV9yei8NWHKAeP2L9WUfyA.jpg"],
      ["MB007", "Gadar 2", "8.5", "Standard", "Action/Drama", "Running", "Tara Singh ventures across the border to rescue his son.", "Hindi", "Bollywood", "170 min", "https://image.tmdb.org/t/p/w500/z6D9zX8K9VfL8OxyW9X2pXfX2X3.jpg"],
      ["MB008", "Sultan", "8.9", "Standard", "Sports/Drama", "Running", "A wrestling champion looks for a comeback.", "Hindi", "Bollywood", "170 min", "https://image.tmdb.org/t/p/w500/6mtVn4O1gSWGvCXCo8Sv8gc9jL5.jpg"],

      // HOLLYWOOD
      ['MH001', 'Avatar', '9.0', 'IMAX 3D', 'Sci-Fi/Action', 'Running', 'A paraplegic Marine dispatched to the moon Pandora.', 'English', 'Hollywood', '162 min', 'https://image.tmdb.org/t/p/w500/8Y7WrRK1iQHEX7UIftBeBMjPjWD.jpg'],
      ['MH003', 'Titanic', '9.4', 'Standard', 'Romance/Drama', 'Running', 'A seventeen-year-old aristocrat falls in love with a kind but poor artist.', 'English', 'Hollywood', '194 min', 'https://image.tmdb.org/t/p/w500/6mtVn4O1gSWGvCXCo8Sv8gc9jL5.jpg'],
      ['MH004', 'Star Wars: TFA', '8.9', 'IMAX 3D', 'Sci-Fi/Adventure', 'Running', 'A new threat rises in the galaxy.', 'English', 'Hollywood', '138 min', 'https://image.tmdb.org/t/p/w500/6EiRUJp6YvM9C3pX7K3m5W.jpg'],
      ['MH005', 'Avengers: Infinity War', '9.5', 'IMAX 3D', 'Superhero', 'Running', 'The Avengers must stop Thanos from collecting all Infinity Stones.', 'English', 'Hollywood', '149 min', 'https://image.tmdb.org/t/p/w500/7WsyChvgynooYst13uO9unS9m7X.jpg'],
      ['MH006', 'Spider-Man: No Way Home', '9.3', 'IMAX 3D', 'Superhero', 'Running', 'Peter Parker seeks the help of Doctor Strange.', 'English', 'Hollywood', '148 min', 'https://image.tmdb.org/t/p/w500/uJYYizSuA9Y3DCs0qS4qWvHfZg4.jpg'],
      ['MH007', 'Jurassic World', '8.7', 'Standard', 'Sci-Fi/Adventure', 'Running', 'A new theme park, built on the original site of Jurassic Park.', 'English', 'Hollywood', '124 min', 'https://image.tmdb.org/t/p/w500/A0snKWfS66bImsmYFvD96Mps9rR.jpg']
    ];

    for (const m of movies) {
      await pool.query(
        'INSERT INTO movie (movie_id, movie_name, movie_rating, movie_dimensions, genre, status, description, language, category, duration, poster) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT(movie_id) DO UPDATE SET movie_name=EXCLUDED.movie_name, category=EXCLUDED.category, duration=EXCLUDED.duration, poster=EXCLUDED.poster',
        m
      );
    }
    console.log('Movies seeded.');

    // 3. Seed Professional Theaters
    const theaters = [
      ['Cinepolis Nexus', 'Hyderabad'],
      ['INOX GVK', 'Hyderabad'],
      ['PVR Forum', 'Hyderabad'],
      ['Cinepolis Ahmedabad One', 'Ahmedabad'],
      ['PVR Acropolis', 'Ahmedabad'],
      ['INOX Himalaya Mall', 'Ahmedabad'],
      ['PVR Phoenix', 'Mumbai'],
      ['Cinepolis Andheri', 'Mumbai'],
      ['INOX Nariman Point', 'Mumbai'],
      ['Cinepolis Nexus Esplanade', 'Bhubaneswar'],
      ['INOX DN Regalia', 'Bhubaneswar'],
      ['PVR Utkal Kanika', 'Bhubaneswar'],
      ['PVR Select Citywalk', 'Delhi'],
      ['INOX Garuda Mall', 'Bengaluru'],
      ['Cinepolis Seasons', 'Pune'],
      ['PVR Express Avenue', 'Chennai'],
      ['INOX Forum Mall', 'Kolkata'],
      ['PVR Lulu Mall', 'Kochi']
    ];

    const theaterIds = [];
    for (const t of theaters) {
      const res = await pool.query('INSERT INTO theater (theater_name, city) VALUES ($1, $2) RETURNING theater_id', t);
      theaterIds.push(res.rows[0].theater_id);
    }
    console.log('Theaters seeded.');

    // 4. Seed Shows (Multiple dates and times)
    console.log('Generating show schedules and manual mock entries...');
    
    // 4.1 Force-Seed Mock IDs for Selection Hub Stability
    const mockShows = [
      ['M001', theaterIds[0], '10:15:00', new Date().toISOString().split('T')[0], 1, 'IMAX 3D', 101],
      ['M001', theaterIds[0], '18:05:00', new Date().toISOString().split('T')[0], 1, '3D', 102],
      ['M001', theaterIds[1], '10:45:00', new Date().toISOString().split('T')[0], 2, '2D', 201],
      ['M001', theaterIds[1], '19:40:00', new Date().toISOString().split('T')[0], 2, '3D', 202],
      ['M001', theaterIds[2], '16:00:00', new Date().toISOString().split('T')[0], 3, '2D', 301],
      ['M001', theaterIds[3], '13:15:00', new Date().toISOString().split('T')[0], 4, '2D', 401],
      ['M001', theaterIds[4], '18:00:00', new Date().toISOString().split('T')[0], 5, '2D', 501]
    ];

    for (const s of mockShows) {
        await pool.query(
            'INSERT INTO shows (movie_id, theater_id, timmings, show_date, screen_no, screen_dimensions, screen_id) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (screen_id) DO NOTHING',
            s
        );
    }

    const today = new Date();
    const dates = [];
    for (let i = 0; i < 3; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }

    const times = ['14:30:00', '20:00:00'];
    const dimensions = ['2D', '3D', 'IMAX 3D', '4DX'];
    
    let showValues = [];
    let showParams = [];
    let paramCounter = 1;

    console.log('Batching show insertions...');
    for (const tId of theaterIds) {
      for (const m of movies) {
        if (Math.random() > 0.4) {
          for (const date of dates) {
            for (const time of times) {
                showValues.push(`($${paramCounter++}, $${paramCounter++}, $${paramCounter++}, $${paramCounter++}, $${paramCounter++}, $${paramCounter++}, $${paramCounter++})`);
                showParams.push(m[0], tId, time, date, Math.floor(Math.random() * 5 + 1), dimensions[Math.floor(Math.random() * dimensions.length)], 100);
                
                if (showValues.length >= 100) {
                  await pool.query(`INSERT INTO shows (movie_id, theater_id, timmings, show_date, screen_no, screen_dimensions, no_of_seats) VALUES ${showValues.join(',')}`, showParams);
                  showValues = [];
                  showParams = [];
                  paramCounter = 1;
                }
            }
          }
        }
      }
    }
    if (showValues.length > 0) {
      await pool.query(`INSERT INTO shows (movie_id, theater_id, timmings, show_date, screen_no, screen_dimensions, no_of_seats) VALUES ${showValues.join(',')}`, showParams);
    }
    console.log('Show schedules generated.');

    // 5. Seed Admin
    await pool.query('INSERT INTO admin (user_name, password) VALUES ($1, $2) ON CONFLICT DO NOTHING', ['admin', '$2b$10$Ex7a3U/6v6k.6hMv3I5BieH2h9lF5Y.Uu/K8b6VjJvUuJ/v8v5q/m']);
    
    console.log('Seed Completed Successfully! 🍿');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Seed Failed:', error);
    await pool.end();
    process.exit(1);
  }
}

seed();
