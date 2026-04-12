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
  getSession: () => {
    try {
      return JSON.parse(localStorage.getItem('movie_magic_user')) || null;
    } catch { return null; }
  },
  logout: () => {
    localStorage.removeItem('movie_magic_user');
    window.location.href = '/login.html';
  }
};

const UI = {
  // Defensive Rendering: Clears container before adding new context
  safeRender: (id, html) => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = ""; // Force clear before render to prevent overlapping
      el.insertAdjacentHTML('beforeend', html);
    }
  },

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
    const selectedCity = localStorage.getItem('selectedCity') || 'Select City';
    
    nav.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1.5rem;">
        <a href="/" class="logo"><i>🎬</i> MOVIE MAGIC</a>
        <button id="navCityBtn" style="background: transparent; color: var(--text-muted); border: 1px solid #444; padding: 6px 12px; border-radius: 4px; cursor: pointer;" 
          onclick="if(window.showCityModal) { showCityModal(); } else { window.location.href = '/?showModal=true'; }">
          ${selectedCity} ▾
        </button>
      </div>
      <div class="search-bar">
        <input type="text" id="movie-search" placeholder="Search movies, genres..." onkeyup="handleSearch(this.value)">
      </div>
      <div class="links">
        <a href="/">Home</a>
        ${user ? `
          <a href="/history.html">History</a>
          ${isAdmin ? '<a href="/admin.html" style="color: var(--primary)">Admin Panel</a>' : ''}
          <div style="display: flex; align-items: center; gap: 18px; margin-left: 10px;">
            <div class="nav-avatar">
              ${user.profile_pic ? 
                `<img src="${user.profile_pic}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                `<div class="nav-avatar-initials">${user.name ? user.name.charAt(0) : 'U'}</div>`
              }
            </div>
            <button onclick="API.logout()" class="btn-logout-nav">Logout</button>
          </div>
        ` : `
          <a href="/login.html">Login</a>
          <a href="/signup.html" class="btn-primary" style="padding: 0.6rem 1.2rem; margin-left: 5px;">Join Now</a>
        `}
      </div>
    `;
  },

  setupOTPInput: (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const inputs = container.querySelectorAll('.otp-input');

    inputs.forEach((input, index) => {
      // Handle Typing
      input.addEventListener('input', (e) => {
        if (e.inputType === 'deleteContentBackward') return;
        const val = input.value;
        if (val.length > 1) {
          input.value = val.charAt(0);
        }
        if (val && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });

      // Handle Backspace
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
          inputs[index - 1].focus();
        }
      });

      // Handle Paste
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').slice(0, 6).split('');
        data.forEach((char, i) => {
          if (inputs[i]) {
            inputs[i].value = char;
            if (i < inputs.length - 1) inputs[i + 1].focus();
          }
        });
      });
    });
  },

  getOTPValue: (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return "";
    return Array.from(container.querySelectorAll('.otp-input'))
      .map(input => input.value)
      .join('');
  }
};

// Global Search Handler
window.handleSearch = (val) => {
  const cards = document.querySelectorAll('.movie-card');
  const query = val.toLowerCase();
  cards.forEach(card => {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(query) ? 'block' : 'none';
  });
};

// Inject Global UI styles
const style = document.createElement('style');
style.textContent = `
  .toast { position: fixed; top: 20px; right: 20px; padding: 1rem 2rem; border-radius: 8px; z-index: 9999; animation: slideIn 0.3s ease; }
  .toast.error { background: #E50914; color: white; }
  .toast.success { background: #28a745; color: white; }
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  
  .search-bar { flex: 1; max-width: 400px; margin: 0 2rem; }
  .search-bar input { width: 100%; padding: 0.6rem 1.2rem; background: #2A2A2A; border: 1px solid var(--glass); border-radius: 20px; color: white; outline: none; transition: all 0.3s; }
  .search-bar input:focus { border-color: var(--primary); box-shadow: 0 0 10px rgba(229, 9, 20, 0.2); }
`;
document.head.appendChild(style);

window.addEventListener('DOMContentLoaded', UI.initNavbar);
