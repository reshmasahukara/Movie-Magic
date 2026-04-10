const API = {
  async fetch(endpoint, options = {}) {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Server Error');
    return data;
  },

  setSession(user) {
    localStorage.setItem('movie_magic_user', JSON.stringify(user));
  },

  getSession() {
    const user = localStorage.getItem('movie_magic_user');
    return user ? JSON.parse(user) : null;
  },

  logout() {
    localStorage.removeItem('movie_magic_user');
    window.location.href = '/login.html';
  }
};

// UI Helpers
const UI = {
  showMessage(text, type = 'error') {
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.style.cssText = `
      position: fixed; top: 20px; right: 20px; 
      background: ${type === 'error' ? '#ff4444' : '#00C851'};
      color: white; padding: 1rem 2rem; border-radius: 8px; z-index: 2000;
    `;
    div.textContent = text;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  }
};
