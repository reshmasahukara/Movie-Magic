import ejs from 'ejs';
import path from 'path';

/**
 * Renders an EJS view and sends it as a response.
 */
export async function renderView(res, viewName, data = {}) {
  try {
    const viewPath = path.join(process.cwd(), 'views', `${viewName}.ejs`);
    const html = await ejs.renderFile(viewPath, data);
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error(`Rendering error for ${viewName}:`, error);
    res.status(500).json({ error: error.message });
  }
}

// Fallback handler if api/render is hit directly
export default async function handler(req, res) {
  res.status(200).json({ message: "Rendering Utility Active" });
}
