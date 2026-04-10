const db = require('../../utils/db');
const { renderView } = require('../../utils/render');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  const { userid } = req.query;

  try {
    const result = await db.query('SELECT * FROM customer WHERE user_id = $1', [userid]);
    await renderView(res, 'profile', { result: result.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error loading profile");
  }
};
