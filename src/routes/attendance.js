const express = require('express');
const { body } = require('express-validator');
const { pool } = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { handleValidation } = require('../utils/validate');

const router = express.Router();

async function canManageEvent(user, eventId) {
  const ev = await pool.query('SELECT * FROM events WHERE id=$1', [eventId]);
  if (!ev.rowCount) return { ok: false, status: 404, error: 'Event not found' };
  const event = ev.rows[0];
  if (user.role === 'admin' || Number(event.organizer_id) === Number(user.id)) return { ok: true, event };
  return { ok: false, status: 403, error: 'Forbidden' };
}

router.get('/event/:eventId', requireAuth, requireRole('admin', 'organizer'), async (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);
    if (!Number.isInteger(eventId)) return res.status(400).json({ error: 'Invalid event id' });
    const perm = await canManageEvent(req.session.user, eventId);
    if (!perm.ok) return res.status(perm.status).json({ error: perm.error });
    const rows = await pool.query(
      `SELECT a.*, u.name, u.email, u.roll_number FROM attendance a
       JOIN users u ON u.id = a.user_id WHERE a.event_id=$1 ORDER BY a.checked_in_at DESC`,
      [eventId]
    );
    res.json({ attendance: rows.rows });
  } catch (err) { next(err); }
});

router.post(
  '/check-in',
  requireAuth,
  requireRole('admin', 'organizer'),
  [body('event_id').isInt({ min: 1 }).toInt(), body('user_id').isInt({ min: 1 }).toInt()],
  handleValidation,
  async (req, res, next) => {
    try {
      const { event_id, user_id } = req.body;
      const perm = await canManageEvent(req.session.user, event_id);
      if (!perm.ok) return res.status(perm.status).json({ error: perm.error });
      const reg = await pool.query('SELECT * FROM registrations WHERE event_id=$1 AND user_id=$2 AND status=\'registered\'', [event_id, user_id]);
      if (!reg.rowCount) return res.status(400).json({ error: 'User is not registered for this event' });
      const existing = await pool.query('SELECT * FROM attendance WHERE event_id=$1 AND user_id=$2', [event_id, user_id]);
      if (existing.rowCount) return res.status(409).json({ error: 'Already checked in', attendance: existing.rows[0] });
      const ins = await pool.query(
        `INSERT INTO attendance (event_id, user_id, marked_by) VALUES ($1,$2,$3) RETURNING *`,
        [event_id, user_id, req.session.user.id]
      );
      await pool.query(`UPDATE registrations SET status='attended' WHERE event_id=$1 AND user_id=$2`, [event_id, user_id]);
      res.status(201).json({ attendance: ins.rows[0] });
    } catch (err) { next(err); }
  }
);

router.post(
  '/unmark',
  requireAuth,
  requireRole('admin', 'organizer'),
  [body('event_id').isInt({ min: 1 }).toInt(), body('user_id').isInt({ min: 1 }).toInt()],
  handleValidation,
  async (req, res, next) => {
    try {
      const { event_id, user_id } = req.body;
      const perm = await canManageEvent(req.session.user, event_id);
      if (!perm.ok) return res.status(perm.status).json({ error: perm.error });
      await pool.query('DELETE FROM attendance WHERE event_id=$1 AND user_id=$2', [event_id, user_id]);
      await pool.query(`UPDATE registrations SET status='registered' WHERE event_id=$1 AND user_id=$2 AND status='attended'`, [event_id, user_id]);
      res.json({ ok: true });
    } catch (err) { next(err); }
  }
);

module.exports = router;
