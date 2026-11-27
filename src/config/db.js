const { Pool } = require('pg');

const isProd = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

if (isProd && !connectionString) {
  console.error('Missing required DATABASE_URL in production.');
  process.exit(1);
}

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
      }
    : undefined
);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

async function verifyDatabaseConnection() {
  if (!connectionString) {
    console.warn('DATABASE_URL not set; skipping database connection check.');
    return false;
  }
  await pool.query('SELECT 1');
  return true;
}

module.exports = { pool, verifyDatabaseConnection };
