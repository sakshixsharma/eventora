const express = require('express');
const { body } = require('express-validator');
const { pool } = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { handleValidation } = require('../utils/validate');

const router = express.Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT r.*, e.title, e.starts_at, e.ends_at, e.venue, e.category, e.status AS event_status
       FROM registrations r JOIN events e ON e.id = r.event_id
       WHERE r.user_id = $1 ORDER BY r.registered_at DESC`,
      [req.session.user.id]
    );
    res.json({ registrations: result.rows });
  } catch (err) { next(err); }
});

router.get('/event/:eventId', requireAuth, requireRole('admin', 'organizer'), async (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);
    if (!Number.isInteger(eventId)) return res.status(400).json({ error: 'Invalid event id' });
    const eventRes = await pool.query('SELECT * FROM events WHERE id=$1', [eventId]);
    if (!eventRes.rowCount) return res.status(404).json({ error: 'Event not found' });
    const event = eventRes.rows[0];
    const user = req.session.user;
    if (user.role !== 'admin' && Number(event.organizer_id) !== Number(user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const regs = await pool.query(
      `SELECT r.*, u.name, u.email, u.department, u.roll_number
       FROM registrations r JOIN users u ON u.id = r.user_id
       WHERE r.event_id=$1 ORDER BY r.registered_at DESC`,
      [eventId]
    );
    res.json({ registrations: regs.rows });
  } catch (err) { next(err); }
});

router.post(
  '/',
  requireAuth,
  [body('event_id').isInt({ min: 1 }).toInt()],
  handleValidation,
  async (req, res, next) => {
    const client = await pool.connect();
    try {
      const userId = req.session.user.id;
      const eventId = req.body.event_id;
      await client.query('BEGIN');
      const eventRes = await client.query('SELECT * FROM events WHERE id=$1 FOR UPDATE', [eventId]);
      if (!eventRes.rowCount) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Event not found' });
      }
      const event = eventRes.rows[0];
      if (event.status !== 'published') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Event is not open for registration' });
      }
      const existing = await client.query('SELECT * FROM registrations WHERE event_id=$1 AND user_id=$2', [eventId, userId]);
      if (existing.rowCount && existing.rows[0].status === 'registered') {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Already registered' });
      }
      const countRes = await client.query(
        `SELECT COUNT(*)::int AS count FROM registrations WHERE event_id=$1 AND status='registered'`,
        [eventId]
      );
      if (countRes.rows[0].count >= event.capacity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Event is full' });
      }
      let reg;
      if (existing.rowCount) {
        reg = await client.query(
          `UPDATE registrations SET status='registered', registered_at=NOW() WHERE id=$1 RETURNING *`,
          [existing.rows[0].id]
        );
      } else {
        reg = await client.query(
          `INSERT INTO registrations (event_id,user_id,status) VALUES ($1,$2,'registered') RETURNING *`,
          [eventId, userId]
        );
      }
      await client.query(`INSERT INTO notifications (user_id,message) VALUES ($1,$2)`, [userId, `You registered for "${event.title}".`]);
      await client.query('COMMIT');
      res.status(201).json({ registration: reg.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      next(err);
    } finally {
      client.release();
    }
  }
);

router.post('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid registration id' });
    const regRes = await pool.query('SELECT * FROM registrations WHERE id=$1', [id]);
    if (!regRes.rowCount) return res.status(404).json({ error: 'Registration not found' });
    const reg = regRes.rows[0];
    const user = req.session.user;
    if (user.role !== 'admin' && Number(reg.user_id) !== Number(user.id)) return res.status(403).json({ error: 'Forbidden' });
    if (reg.status === 'cancelled') return res.json({ registration: reg });
    const upd = await pool.query(`UPDATE registrations SET status='cancelled' WHERE id=$1 RETURNING *`, [id]);
    res.json({ registration: upd.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
