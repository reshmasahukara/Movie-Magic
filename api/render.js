import ejs from 'ejs';
import path from 'path';
import fs from 'fs';

/**
 * Renders an EJS view and sends it as a response.
 */
export async function renderView(res, viewName, data = {}) {
  const viewsDir = path.join(process.cwd(), 'views');
  const viewPath = path.join(viewsDir, `${viewName}.ejs`);

  try {
    // Debug: Check if views directory exists in the serverless bundle
    if (!fs.existsSync(viewsDir)) {
      throw new Error(`Views directory not found at ${viewsDir}`);
    }

    if (!fs.existsSync(viewPath)) {
      throw new Error(`Template not found at ${viewPath}`);
    }

    const html = await ejs.renderFile(viewPath, data);
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error(`Rendering Error [${viewName}]:`, error.message);
    res.status(500).json({ 
      error: "Render Failure",
      details: error.message,
      pathChecked: viewPath,
      suggestion: "Ensure 'views' folder is included in vercel.json 'includeFiles'"
    });
  }
}

// Fallback handler if api/render is hit directly
export default async function handler(req, res) {
  res.status(200).json({ message: "Rendering Utility Active" });
}
