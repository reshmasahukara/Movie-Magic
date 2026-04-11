import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// 1. Static Middleware
app.use(express.static(path.join(__dirname, 'public')));

// 2. Mock Vercel Routing for API
app.all('/api/:fn', async (req, res) => {
  const fn = req.params.fn;
  const filePath = path.join(__dirname, 'api', `${fn}.js`);
  
  if (fs.existsSync(filePath)) {
    try {
      const { default: handler } = await import(`file://${filePath}`);
      // Vercel handlers expect (req, res)
      await handler(req, res);
    } catch (err) {
      console.error(`API Error (${fn}):`, err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(404).json({ error: 'API not found' });
  }
});

// 3. Page Rewrites (from vercel.json)
const rewrites = [
  ['/index', '/index.html'],
  ['/login', '/login.html'],
  ['/signup', '/signup.html'],
  ['/dashboard', '/dashboard.html'],
  ['/booking', '/booking.html'],
  ['/admin', '/admin.html'],
  ['/seats', '/seats.html']
];

rewrites.forEach(([source, dest]) => {
  app.get(source, (req, res) => res.sendFile(path.join(__dirname, 'public', dest)));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Test Server running at http://localhost:${PORT}`);
});
