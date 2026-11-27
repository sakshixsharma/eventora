const express = require('express');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const { pool } = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { handleValidation } = require('../utils/validate');

const router = express.Router();

function safeUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, department: u.department, roll_number: u.roll_number, phone: u.phone, is_active: u.is_active, created_at: u.created_at };
}

router.get('/', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ users: result.rows.map(safeUser) });
  } catch (err) { next(err); }
});

router.put(
  '/me',
  requireAuth,
  [
    body('name').optional().trim().notEmpty().isLength({ max: 120 }),
    body('department').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
    body('roll_number').optional({ values: 'falsy' }).trim().isLength({ max: 50 }),
    body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
    body('password').optional().isLength({ min: 8 }),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const id = req.session.user.id;
      const existing = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
      if (!existing.rowCount) return res.status(404).json({ error: 'User not found' });
      const cur = existing.rows[0];
      const { name, department, roll_number, phone, password } = req.body;
      let passwordHash = cur.password_hash;
      if (password) passwordHash = await bcrypt.hash(password, 12);
      if (roll_number && roll_number !== cur.roll_number) {
        const dup = await pool.query('SELECT id FROM users WHERE roll_number=$1 AND id<>$2', [roll_number, id]);
        if (dup.rowCount) return res.status(409).json({ error: 'Roll number already registered' });
      }
      const upd = await pool.query(
        `UPDATE users SET name=$1, department=$2, roll_number=$3, phone=$4, password_hash=$5 WHERE id=$6 RETURNING *`,
        [name ?? cur.name, department ?? cur.department, roll_number ?? cur.roll_number, phone ?? cur.phone, passwordHash, id]
      );
      const user = safeUser(upd.rows[0]);
      req.session.user.name = user.name;
      res.json({ user });
    } catch (err) { next(err); }
  }
);

router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  [
    body('role').optional().isIn(['student', 'organizer', 'admin']),
    body('is_active').optional().isBoolean().toBoolean(),
    body('name').optional().trim().notEmpty().isLength({ max: 120 }),
    body('department').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid user id' });
      const existing = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
      if (!existing.rowCount) return res.status(404).json({ error: 'User not found' });
      const cur = existing.rows[0];
      const { role, is_active, name, department } = req.body;
      const upd = await pool.query(
        `UPDATE users SET role=$1, is_active=$2, name=$3, department=$4 WHERE id=$5 RETURNING *`,
        [role ?? cur.role, typeof is_active === 'boolean' ? is_active : cur.is_active, name ?? cur.name, department ?? cur.department, id]
      );
      res.json({ user: safeUser(upd.rows[0]) });
    } catch (err) { next(err); }
  }
);

module.exports = router;
