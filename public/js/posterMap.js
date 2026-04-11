/**
 * MOVIE MAGIC - Centralized Poster Mapping
 * Edit this file to manually control all movie posters without touching the database.
 */

const FALLBACK_POSTER = "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=80";

const POSTER_MAP = {
  // FLAGSHIP MOVIES
  "RAAKA": "https://media5.bollywoodhungama.in/wp-content/uploads/2026/04/Raaka-322x483.jpg",
  "OG": "https://fullyfilmy.in/cdn/shop/files/COLLECTION_PHONE.png?v=1756819764&width=800",
  "SPIRIT": "https://cdn.district.in/movies-assets/images/cinema/1Spirit_Gallery-af2129a0-16d4-11f1-8a94-b3907dd8fb01.jpg",
  "VARANASI": "https://image.tmdb.org/t/p/w500/nL2g8oV9yei8NWHKAeP2L9WUfyA.jpg",
  "DRAGON": "https://images.filmibeat.com/img/280x383/popcorn/movie_posters/ntr31-20220520120944-19909.jpg",
  "PUSHPA THE RULE": "https://image.tmdb.org/t/p/w500/u9b4v6DxGiETJkxTntEzAprq3t9.jpg",
  "BAHUBALI 2": "https://image.tmdb.org/t/p/w500/xqByjvldxtC1v5bF7acUpt0gOc3.jpg",
  "STRANGER THINGS S5": "https://wallpapercave.com/wp/wp11785191.jpg",
  "AVENGERS END GAME": "https://image.tmdb.org/t/p/w500/2rrLBRKlVJJS0zQ1WVazgNCl4TE.jpg",

  // TOLLYWOOD
  "Baahubali: The Beginning": "https://image.tmdb.org/t/p/w500/961YqzOswV0X9idmSmeqe9RmYp.jpg",
  "RRR": "https://image.tmdb.org/t/p/w500/ljHw5eIMnki3HekwkKwCCHsRSbH.jpg",
  "Kalki 2898 AD": "https://image.tmdb.org/t/p/w500/9r0QqBQsD3G5D7P0YMxg3hkkGpz.jpg",
  "Salaar: Part 1": "https://image.tmdb.org/t/p/w500/mNHdClul57prczb5O0krrzyonnn.jpg",
  "Saaho": "https://image.tmdb.org/t/p/w500/nkWAw6mDVWh3w7QA3eg0hKcMXWo.jpg",
  "Devara: Part 1": "https://image.tmdb.org/t/p/w500/nkWAw6mDVWh3w7QA3eg0hKcMXWo.jpg",
  "Pushpa: The Rise": "https://image.tmdb.org/t/p/w500/u9b4v6DxGiETJkxTntEzAprq3t9.jpg",

  // BOLLYWOOD
  "Dangal": "https://image.tmdb.org/t/p/w500/1xoavuB5bO92wo3eFQjZN2I9ptV.jpg",
  "Jawan": "https://image.tmdb.org/t/p/w500/bMISXhkBDll6JPsevdJJ1ItnW6S.jpg",
  "Pathaan": "https://image.tmdb.org/t/p/w500/juJ8m4zrZ4xjKjRNapQJjDwNXMz.jpg",
  "Bajrangi Bhaijaan": "https://image.tmdb.org/t/p/w500/nL2g8oV9yei8NWHKAeP2L9WUfyA.jpg",
  "Animal": "https://image.tmdb.org/t/p/w500/hr9rjR3J0xBBKmlJ4n3gHId9ccx.jpg",
  "PK": "https://image.tmdb.org/t/p/w500/nL2g8oV9yei8NWHKAeP2L9WUfyA.jpg",
  "Gadar 2": "https://image.tmdb.org/t/p/w500/z6D9zX8K9VfL8OxyW9X2pXfX2X3.jpg",
  "Sultan": "https://image.tmdb.org/t/p/w500/6mtVn4O1gSWGvCXCo8Sv8gc9jL5.jpg",

  // HOLLYWOOD
  "Avatar": "https://image.tmdb.org/t/p/w500/8Y7WrRK1iQHEX7UIftBeBMjPjWD.jpg",
  "Avatar: Way of Water": "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmYp.jpg",
  "Titanic": "https://image.tmdb.org/t/p/w500/6mtVn4O1gSWGvCXCo8Sv8gc9jL5.jpg",
  "Star Wars: TFA": "https://image.tmdb.org/t/p/w500/6EiRUJp6YvM9C3pX7K3m5W.jpg",
  "Avengers: Infinity War": "https://image.tmdb.org/t/p/w500/7WsyChvgynooYst13uO9unS9m7X.jpg",
  "Spider-Man: No Way Home": "https://image.tmdb.org/t/p/w500/uJYYizSuA9Y3DCs0qS4qWvHfZg4.jpg",
  "Jurassic World": "https://image.tmdb.org/t/p/w500/A0snKWfS66bImsmYFvD96Mps9rR.jpg"
};

/**
 * Global utility to get poster by name
 */
window.MoviePoster = {
  get: function(movieName) {
    if (!movieName) return FALLBACK_POSTER;
    // Look up exact or trimmed
    const cleanName = movieName.trim();
    return POSTER_MAP[cleanName] || FALLBACK_POSTER;
  }
};
