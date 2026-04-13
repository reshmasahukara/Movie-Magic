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
      <div class="nav-container">
        <!-- LEFT: Premium Branding -->
        <div class="nav-left">
          <a href="/" class="logo"><i>🎬</i> MOVIE MAGIC</a>
        </div>

        <!-- CENTER: City & Search Grouped -->
        <div class="nav-center no-mobile">
          <button id="navCityBtn" onclick="if(window.showCityModal) { showCityModal(); } else { window.location.href = '/?showModal=true'; }">
            <span style="opacity: 0.6;">📍</span> ${selectedCity} ▾
          </button>
          
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" id="movie-search" class="search-bar" placeholder="Search Movies, Events, Sports..." onkeyup="handleSearch(this.value)">
          </div>
        </div>

        <!-- RIGHT: Interactions -->
        <div class="nav-right">
          <div class="links no-mobile" id="nav-links">
            <a href="/">Home</a>
            ${user ? `<a href="/history.html">History</a>` : ''}
            ${isAdmin ? `<a href="/admin.html" style="color: var(--primary); font-weight: 800;">Admin Panel</a>` : ''}
          </div>

          <div class="user-actions">
            ${user ? `
              <div class="nav-avatar" onclick="window.location.href='/dashboard.html'">
                ${user.profile_pic ? 
                  `<img src="${user.profile_pic}">` : 
                  `<div class="nav-avatar-initials">${user.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>`
                }
              </div>
              <button onclick="API.logout()" class="btn-logout-nav no-mobile">Logout</button>
            ` : `
              <a href="/login.html" style="color:white; text-decoration:none; font-weight:600;" class="no-mobile">Login</a>
              <a href="/signup.html" class="btn-primary" style="padding: 0.7rem 1.6rem; border-radius: 30px; font-size: 0.9rem;">Join Now</a>
            `}
            
            <!-- Mobile Menu Toggle -->
            <button class="mobile-toggle" onclick="UI.toggleMobileMenu()" style="display:none; background:transparent; border:none; color:white; font-size:1.8rem; cursor:pointer;">☰</button>
          </div>
        </div>
      </div>
      
      <!-- Mobile Sidebar -->
      <div id="mobileSidebar" class="mobile-sidebar" style="position:fixed; top:0; right:-100%; width:80%; height:100vh; background:rgba(8,8,8,0.98); backdrop-filter:blur(20px); z-index:10001; transition:0.4s; padding:2rem; display:flex; flex-direction:column; gap:2rem; border-left:1px solid rgba(255,255,255,0.05);">
        <button onclick="UI.toggleMobileMenu()" style="align-self:flex-end; background:transparent; border:none; color:white; font-size:2.5rem;">&times;</button>
        <div style="display:flex; flex-direction:column; gap:1.5rem; font-size:1.4rem;">
            <a href="/" style="color:white; text-decoration:none;">Home</a>
            ${user ? `<a href="/history.html" style="color:white; text-decoration:none;">Booking History</a>` : ''}
            ${isAdmin ? `<a href="/admin.html" style="color:var(--primary); text-decoration:none;">Admin Management</a>` : ''}
            ${user ? `<a href="javascript:API.logout()" style="color:var(--primary); text-decoration:none;">Logout</a>` : `<a href="/login.html" style="color:white; text-decoration:none;">Login</a>`}
        </div>
      </div>
    `;
  },

  toggleMobileMenu: () => {
    const sidebar = document.getElementById('mobileSidebar');
    if (sidebar.style.right === '0px') {
        sidebar.style.right = '-100%';
    } else {
        sidebar.style.right = '0px';
    }
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
