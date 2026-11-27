/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

async function init() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(sql);
  console.log('Database schema applied.');
}

init()
  .catch((err) => {
    console.error('DB init failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });
