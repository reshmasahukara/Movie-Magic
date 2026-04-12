import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function migrate() {
  if (!connectionString) {
    console.error('DATABASE_URL is missing.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Running Screen Constraint Fix...');
    
    // 1. Update any existing nulls to 1
    await pool.query('UPDATE shows SET screen_no = 1 WHERE screen_no IS NULL;');
    
    // 2. Set default value for future inserts
    await pool.query('ALTER TABLE shows ALTER COLUMN screen_no SET DEFAULT 1;');
    
    // 3. Ensure NOT NULL constraint is enforced (should already be, but let's be safe)
    await pool.query('ALTER TABLE shows ALTER COLUMN screen_no SET NOT NULL;');

    console.log('Migration Completed Successfully!');
    await pool.end();
  } catch (error) {
    console.error('Migration Failed:', error);
    await pool.end();
    process.exit(1);
  }
}

migrate();
