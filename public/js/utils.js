const API = {
  fetch: async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },
  saveSession: (user) => localStorage.setItem('movie_magic_user', JSON.stringify(user)),
  getSession: () => JSON.parse(localStorage.getItem('movie_magic_user')),
  logout: () => {
    localStorage.removeItem('movie_magic_user');
    window.location.href = '/login.html';
  }
};

const UI = {
  showMessage: (msg, type = 'error') => {
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  },
  
  initNavbar: () => {
    const nav = document.querySelector('nav');
    if (!nav) return;
    
    const user = API.getSession();
    const isAdmin = user && (user.name === 'admin' || user.email === 'admin@movie.com');
    
    nav.innerHTML = `
      <a href="/" class="logo">MOVIE MAGIC</a>
      <div class="search-bar">
        <input type="text" id="movie-search" placeholder="Search movies, genres..." onkeyup="handleSearch(this.value)">
      </div>
      <div class="links">
        <a href="/">Home</a>
        ${user ? `
          <a href="/history.html">History</a>
          ${isAdmin ? '<a href="/admin.html" style="color: var(--primary)">Admin Panel</a>' : ''}
          <button onclick="API.logout()" class="btn-primary" style="padding: 0.5rem 1rem; margin-left:1rem; background: transparent; border: 1px solid var(--primary)">Logout</button>
        ` : `
          <a href="/login.html">Login</a>
          <a href="/signup.html">Signup</a>
        `}
      </div>
    `;
  }
};

// Global Search Handler (for index.html)
window.handleSearch = (val) => {
  const cards = document.querySelectorAll('.movie-card');
  const query = val.toLowerCase();
  cards.forEach(card => {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(query) ? 'block' : 'none';
  });
};

// Inject Navbar styles and init
const style = document.createElement('style');
style.textContent = `
  .toast { position: fixed; top: 20px; right: 20px; padding: 1rem 2rem; border-radius: 8px; z-index: 9999; animation: slideIn 0.3s ease; }
  .toast.error { background: #E50914; color: white; }
  .toast.success { background: #28a745; color: white; }
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  
  .search-bar { flex: 1; max-width: 400px; margin: 0 2rem; }
  .search-bar input { width: 100%; padding: 0.6rem 1.2rem; background: #2A2A2A; border: 1px solid var(--glass); border-radius: 20px; color: white; outline: none; }
  .search-bar input:focus { border-color: var(--primary); }
`;
document.head.appendChild(style);

window.addEventListener('DOMContentLoaded', UI.initNavbar);
