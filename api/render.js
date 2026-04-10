import ejs from 'ejs';
import path from 'path';
import fs from 'fs';

/**
 * Standardized rendering utility for EJS templates in Vercel.
 * Uses robust path resolution and filesystem checks.
 */
export async function renderView(res, viewName, data = {}) {
  // Use process.cwd() as the base, which is consistent on Vercel
  const viewsDir = path.join(process.cwd(), 'views');
  const viewPath = path.join(viewsDir, `${viewName}.ejs`);

  try {
    // 1. Check if the template exists before trying to render
    if (!fs.existsSync(viewPath)) {
      console.error(`MISSING TEMPLATE: ${viewPath}`);
      return res.status(404).json({ 
        error: "Template Not Found",
        file: `${viewName}.ejs`,
        lookedIn: viewsDir
      });
    }

    // 2. Render and send
    const html = await ejs.renderFile(viewPath, data);
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error(`EJS RENDER ERROR [${viewName}]:`, error.message);
    res.status(500).json({ 
      error: "Page Render Failed",
      details: error.message
    });
  }
}

export default async function handler(req, res) {
  res.status(200).json({ status: "Rendering utility operational" });
}
