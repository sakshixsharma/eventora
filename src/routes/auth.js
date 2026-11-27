const express = require('express');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../utils/validate');

const router = express.Router();

function safeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department,
    roll_number: row.roll_number,
    phone: row.phone,
    is_active: row.is_active,
    created_at: row.created_at,
  };
}

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('department').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
    body('roll_number').optional({ values: 'falsy' }).trim().isLength({ max: 50 }),
    body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { name, email, password, department, roll_number, phone } = req.body;
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rowCount) return res.status(409).json({ error: 'Email already registered' });
      if (roll_number) {
        const roll = await pool.query('SELECT id FROM users WHERE roll_number = $1', [roll_number]);
        if (roll.rowCount) return res.status(409).json({ error: 'Roll number already registered' });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, department, roll_number, phone)
         VALUES ($1,$2,$3,'student',$4,$5,$6) RETURNING *`,
        [name, email, passwordHash, department || null, roll_number || null, phone || null]
      );
      const user = safeUser(result.rows[0]);
      req.session.regenerate((err) => {
        if (err) return next(err);
        req.session.user = { id: user.id, role: user.role, email: user.email, name: user.name };
        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);
          return res.status(201).json({ user });
        });
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      if (!user || !user.is_active) return res.status(401).json({ error: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      const safe = safeUser(user);
      req.session.regenerate((err) => {
        if (err) return next(err);
        req.session.user = { id: safe.id, role: safe.role, email: safe.email, name: safe.name };
        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);
          return res.json({ user: safe });
        });
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('eventora.sid');
    return res.json({ ok: true });
  });
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.user.id]);
    if (!result.rowCount) return res.status(401).json({ error: 'Authentication required' });
    return res.json({ user: safeUser(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
