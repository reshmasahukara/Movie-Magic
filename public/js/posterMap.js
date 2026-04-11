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
  "VARANASI": "https://assets-in.bmscdn.com/iedb/movies/images/mobile/thumbnail/xlarge/varanasi-et00471138-1763361580.jpg",
  "Varanasi": "https://assets-in.bmscdn.com/iedb/movies/images/mobile/thumbnail/xlarge/varanasi-et00471138-1763361580.jpg",
  "DRAGON": "https://images.filmibeat.com/img/280x383/popcorn/movie_posters/ntr31-20220520120944-19909.jpg",
  "PUSHPA THE RULE": "https://image.tmdb.org/t/p/w500/u9b4v6DxGiETJkxTntEzAprq3t9.jpg",
  "BAHUBALI 2": "https://image.tmdb.org/t/p/w500/xqByjvldxtC1v5bF7acUpt0gOc3.jpg",
  "STRANGER THINGS S5": "https://wallpapercave.com/wp/wp11785191.jpg",
  "AVENGERS END GAME": "https://image.tmdb.org/t/p/w500/2rrLBRKlVJJS0zQ1WVazgNCl4TE.jpg",

  // TOLLYWOOD
  "Baahubali: The Beginning": "https://wallpapercave.com/wp/wp8015348.jpg",
  "Bahubali: The Beginning": "https://wallpapercave.com/wp/wp8015348.jpg",
  "Baahubali The Beginning": "https://wallpapercave.com/wp/wp8015348.jpg",
  "Bahubali The Beginning": "https://wallpapercave.com/wp/wp8015348.jpg",
  "BAAHUBALI: THE BEGINNING": "https://wallpapercave.com/wp/wp8015348.jpg",
  "RRR": "https://image.tmdb.org/t/p/w500/ljHw5eIMnki3HekwkKwCCHsRSbH.jpg",
  "Kalki 2898 AD": "https://image.tmdb.org/t/p/w500/9r0QqBQsD3G5D7P0YMxg3hkkGpz.jpg",
  "Salaar: Part 1": "https://image.tmdb.org/t/p/w500/mNHdClul57prczb5O0krrzyonnn.jpg",
  "Saaho": "https://i.redd.it/015f28mt9kdd1.jpeg",
  "SAHOO": "https://i.redd.it/015f28mt9kdd1.jpeg",
  "Devara: Part 1": "https://image.tmdb.org/t/p/w500/nkWAw6mDVWh3w7QA3eg0hKcMXWo.jpg",
  "Pushpa: The Rise": "https://image.tmdb.org/t/p/w500/u9b4v6DxGiETJkxTntEzAprq3t9.jpg",

  // BOLLYWOOD
  "Dangal": "https://image.tmdb.org/t/p/w500/1xoavuB5bO92wo3eFQjZN2I9ptV.jpg",
  "Jawan": "https://image.tmdb.org/t/p/w500/bMISXhkBDll6JPsevdJJ1ItnW6S.jpg",
  "Pathaan": "https://image.tmdb.org/t/p/w500/juJ8m4zrZ4xjKjRNapQJjDwNXMz.jpg",
  "Bajrangi Bhaijaan": "https://upload.wikimedia.org/wikipedia/en/thumb/d/dd/Bajrangi_Bhaijaan_Poster.jpg/250px-Bajrangi_Bhaijaan_Poster.jpg",
  "Animal": "https://image.tmdb.org/t/p/w500/hr9rjR3J0xBBKmlJ4n3gHId9ccx.jpg",
  "PK": "https://image.tmdb.org/t/p/w500/nL2g8oV9yei8NWHKAeP2L9WUfyA.jpg",
  "Gadar 2": "https://m.media-amazon.com/images/I/910Vs55LMZL.jpg",
  "GADAR2": "https://m.media-amazon.com/images/I/910Vs55LMZL.jpg",
  "Sultan": "https://rukminim2.flixcart.com/image/416/416/xif0q/movie/o/0/z/2016-dvd-yash-raj-films-hindi-sultan-movie-original-imah9nr2xnnsxjb9.jpeg?q=70&crop=false",

  // PUSHPA SERIES (High Res)
  "PUSHPA THE RULE": "https://cdn.sacnilk.com/image/movie/2024/6630.jpg",
  "Pushpa The Rule": "https://cdn.sacnilk.com/image/movie/2024/6630.jpg",
  "Pushpa 2: The Rule": "https://cdn.sacnilk.com/image/movie/2024/6630.jpg",
  "Pushpa: The Rise": "https://cdn.bollywoodmdb.com/movies/largethumb/250x350/2021/pushpa/poster.jpg",
  "Pushpa The Rise": "https://cdn.bollywoodmdb.com/movies/largethumb/250x350/2021/pushpa/poster.jpg",
  "Pushpa The Rise Part One": "https://cdn.bollywoodmdb.com/movies/largethumb/250x350/2021/pushpa/poster.jpg",
  "PUSHPA THE RISE": "https://cdn.bollywoodmdb.com/movies/largethumb/250x350/2021/pushpa/poster.jpg",

  // HOLLYWOOD
  "Avatar": "https://image.tmdb.org/t/p/w500/8Y7WrRK1iQHEX7UIftBeBMjPjWD.jpg",
  "Titanic": "https://image.tmdb.org/t/p/w500/6mtVn4O1gSWGvCXCo8Sv8gc9jL5.jpg",
  "Star Wars: TFA": "https://cdn.wallpapersafari.com/43/44/V4h32g.jpg",
  "Avengers: Infinity War": "https://wallpapercave.com/wp/wp7505954.jpg",
  "Spider-Man: No Way Home": "https://image.tmdb.org/t/p/w500/uJYYizSuA9Y3DCs0qS4qWvHfZg4.jpg",
  "Jurassic World": "https://m.media-amazon.com/images/S/pv-target-images/00844b5a51ee3572b364de2180a34dfa6b841777e134cf57323faa0e390703b6.jpg"
};

/**
 * Global utility to get poster by name or object
 */
window.MoviePoster = {
  get: function(movie) {
    if (!movie) return FALLBACK_POSTER;
    
    // Support passing either a string or a movie object
    if (typeof movie === 'string') {
      const cleanName = movie.trim();
      return POSTER_MAP[cleanName] || FALLBACK_POSTER;
    }

    // Logic Priority: movie_name -> title -> local fallback -> global fallback
    const poster = POSTER_MAP[movie.movie_name] || POSTER_MAP[movie.title];
    
    if (!poster && (movie.movie_name || '').toLowerCase().includes('pushpa')) {
        return "/images/movies/pushpa-rise.jpg"; // Local safety fallback for Pushpa
    }
    
    return poster || FALLBACK_POSTER;
  }
};
