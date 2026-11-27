/* eslint-disable no-console */
const bcrypt = require('bcrypt');
const { pool } = require('../src/config/db');

async function seed() {
  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword) {
    console.error('SEED_PASSWORD is required to seed users.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(seedPassword, 12);

  const users = [
    { name: 'Admin User', email: 'admin@eventora.edu', role: 'admin', department: 'Administration' },
    { name: 'Organizer One', email: 'organizer1@eventora.edu', role: 'organizer', department: 'Computer Science' },
    { name: 'Student One', email: 'student1@eventora.edu', role: 'student', department: 'Computer Science' },
  ];

  for (const u of users) {
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, department = EXCLUDED.department`,
      [u.name, u.email, passwordHash, u.role, u.department]
    );
  }

  const org = await pool.query(`SELECT id FROM users WHERE email = $1`, ['organizer1@eventora.edu']);
  const organizerId = org.rows[0]?.id || null;

  const events = [
    {
      title: 'AI Hackathon',
      description: 'Build practical AI solutions in teams.',
      venue: 'Lab 3',
      category: 'Technical',
      starts_at: new Date(Date.now() + 3 * 86400000).toISOString(),
      ends_at: new Date(Date.now() + 3 * 86400000 + 3 * 3600000).toISOString(),
      capacity: 50,
      status: 'published',
    },
    {
      title: 'Cultural Night',
      description: 'Music, dance, and performances.',
      venue: 'Main Auditorium',
      category: 'Cultural',
      starts_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      ends_at: new Date(Date.now() + 7 * 86400000 + 4 * 3600000).toISOString(),
      capacity: 200,
      status: 'published',
    },
  ];

  for (const e of events) {
    await pool.query(
      `INSERT INTO events (title, description, venue, category, starts_at, ends_at, capacity, organizer_id, status)
       SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9
       WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = $1)`,
      [e.title, e.description, e.venue, e.category, e.starts_at, e.ends_at, e.capacity, organizerId, e.status]
    );
  }

  console.log('Seed complete.');
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });
