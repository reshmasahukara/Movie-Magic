import ejs from 'ejs';
import path from 'path';

/**
 * Renders an EJS view and sends it as a response.
 * @param {object} res - Express-like response object
 * @param {string} viewName - Name of the view file in /views (without extension)
 * @param {object} data - Data to pass to the view
 */
export async function renderView(res, viewName, data = {}) {
  try {
    const viewPath = path.join(process.cwd(), 'views', `${viewName}.ejs`);
    const html = await ejs.renderFile(viewPath, data);
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error(`Rendering error for ${viewName}:`, error);
    res.status(500).send(`Server Error: Could not render page ${viewName}`);
  }
}

export default { renderView };
