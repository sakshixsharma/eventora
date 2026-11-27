const express = require('express');
const { body, query } = require('express-validator');
const { pool } = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { handleValidation } = require('../utils/validate');

const router = express.Router();

function canManageEvent(user, event) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.role === 'organizer' && Number(event.organizer_id) === Number(user.id);
}

router.get(
  '/',
  [
    query('search').optional().isString().trim().isLength({ max: 200 }),
    query('category').optional().isString().trim().isLength({ max: 80 }),
    query('upcoming').optional().isIn(['true', 'false', '1', '0']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { search = '', category = '', upcoming } = req.query;
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;
      const where = [];
      const params = [];
      let i = 1;
      if (!req.session.user || req.session.user.role === 'student') {
        where.push(`e.status = 'published'`);
      }
      if (search) { params.push(`%${search}%`); where.push(`(e.title ILIKE $${i} OR e.description ILIKE $${i})`); i++; }
      if (category) { params.push(category); where.push(`e.category = $${i}`); i++; }
      if (upcoming === 'true' || upcoming === '1') { where.push(`e.starts_at >= NOW()`); }
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM events e ${whereSql}`, params);
      params.push(limit, offset);
      const listRes = await pool.query(
        `SELECT e.*, u.name AS organizer_name,
          (SELECT COUNT(*)::int FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered') AS registered_count
         FROM events e LEFT JOIN users u ON u.id = e.organizer_id
         ${whereSql}
         ORDER BY e.starts_at ASC
         LIMIT $${i} OFFSET $${i + 1}`,
        params
      );
      res.json({ events: listRes.rows, page, limit, total: countRes.rows[0].total });
    } catch (err) { next(err); }
  }
);

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid event id' });
    const result = await pool.query(
      `SELECT e.*, u.name AS organizer_name,
        (SELECT COUNT(*)::int FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered') AS registered_count
       FROM events e LEFT JOIN users u ON u.id = e.organizer_id WHERE e.id = $1`,
      [id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Event not found' });
    const event = result.rows[0];
    const user = req.session.user;
    if (event.status !== 'published' && !(user && (user.role === 'admin' || (user.role === 'organizer' && Number(user.id) === Number(event.organizer_id))))) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ event });
  } catch (err) { next(err); }
});

const eventValidators = [
  body('title').trim().notEmpty().isLength({ max: 200 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 5000 }),
  body('venue').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
  body('category').optional({ values: 'falsy' }).trim().isLength({ max: 80 }),
  body('starts_at').isISO8601().toDate(),
  body('ends_at').isISO8601().toDate(),
  body('capacity').isInt({ min: 0 }).toInt(),
  body('status').optional().isIn(['draft', 'published', 'cancelled']),
];

router.post('/', requireAuth, requireRole('admin', 'organizer'), upload.single('image'), eventValidators, handleValidation, async (req, res, next) => {
  try {
    const user = req.session.user;
    const { title, description, venue, category, starts_at, ends_at, capacity, status } = req.body;
    if (new Date(ends_at) < new Date(starts_at)) return res.status(400).json({ error: 'ends_at must be after starts_at' });
    const organizerId = user.role === 'organizer' ? user.id : (req.body.organizer_id ? Number(req.body.organizer_id) : user.id);
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const result = await pool.query(
      `INSERT INTO events (title,description,venue,category,starts_at,ends_at,capacity,organizer_id,status,image_path)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title, description || '', venue || '', category || 'General', starts_at, ends_at, capacity, organizerId, status || 'draft', imagePath]
    );
    res.status(201).json({ event: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/:id', requireAuth, requireRole('admin', 'organizer'), upload.single('image'), eventValidators, handleValidation, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid event id' });
    const existing = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (!existing.rowCount) return res.status(404).json({ error: 'Event not found' });
    const event = existing.rows[0];
    if (!canManageEvent(req.session.user, event)) return res.status(403).json({ error: 'Forbidden' });
    const { title, description, venue, category, starts_at, ends_at, capacity, status } = req.body;
    if (new Date(ends_at) < new Date(starts_at)) return res.status(400).json({ error: 'ends_at must be after starts_at' });
    const imagePath = req.file ? `/uploads/${req.file.filename}` : event.image_path;
    const organizerId = req.session.user.role === 'admin' && req.body.organizer_id ? Number(req.body.organizer_id) : event.organizer_id;
    const result = await pool.query(
      `UPDATE events SET title=$1,description=$2,venue=$3,category=$4,starts_at=$5,ends_at=$6,capacity=$7,status=$8,image_path=$9,organizer_id=$10
       WHERE id=$11 RETURNING *`,
      [title, description || '', venue || '', category || 'General', starts_at, ends_at, capacity, status || event.status, imagePath, organizerId, id]
    );
    const updated = result.rows[0];
    if (status === 'cancelled' && event.status !== 'cancelled') {
      const regs = await pool.query(`SELECT user_id FROM registrations WHERE event_id=$1 AND status='registered'`, [id]);
      for (const r of regs.rows) {
        await pool.query(`INSERT INTO notifications (user_id, message) VALUES ($1,$2)`, [r.user_id, `Event "${updated.title}" was cancelled.`]);
      }
    }
    res.json({ event: updated });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, requireRole('admin', 'organizer'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid event id' });
    const existing = await pool.query('SELECT * FROM events WHERE id=$1', [id]);
    if (!existing.rowCount) return res.status(404).json({ error: 'Event not found' });
    if (!canManageEvent(req.session.user, existing.rows[0])) return res.status(403).json({ error: 'Forbidden' });
    await pool.query('DELETE FROM events WHERE id=$1', [id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
