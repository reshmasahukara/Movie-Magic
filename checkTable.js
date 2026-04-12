import { query } from './api/db.js';

async function checkTable() {
  try {
    const res = await query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    console.log('Tables:', res.rows.map(r => r.tablename));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkTable();
