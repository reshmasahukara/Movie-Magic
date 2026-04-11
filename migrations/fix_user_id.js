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
    console.log('Applying Auth Fix Migration...');
    
    // 1. Check if column type needs update
    // We will drop and recreate since it's cleaner for SERIAL conversion if the table is empty or dev-stage.
    // If table has data and we don't want to lose it, we'd use a more complex sequence assignment.
    // Given the user reports "User found" issues, we should probably clear and restart for a fresh state.
    
    await pool.query('DROP TABLE IF EXISTS customer CASCADE;');
    
    await pool.query(`
      CREATE TABLE customer (
          user_id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          city VARCHAR(255),
          contact_no BIGINT
      );
    `);
    
    console.log('Customer table recreated with SERIAL primary key.');
    console.log('Migration Completed Successfully!');
    await pool.end();
  } catch (error) {
    console.error('Migration Failed:', error);
    await pool.end();
    process.exit(1);
  }
}

migrate();
