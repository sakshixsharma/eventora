const express = require('express');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,
      [req.session.user.id]
    );
    res.json({ notifications: result.rows });
  } catch (err) { next(err); }
});

router.post('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid notification id' });
    const upd = await pool.query(
      `UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2 RETURNING *`,
      [id, req.session.user.id]
    );
    if (!upd.rowCount) return res.status(404).json({ error: 'Notification not found' });
    res.json({ notification: upd.rows[0] });
  } catch (err) { next(err); }
});

router.post('/read-all', requireAuth, async (req, res, next) => {
  try {
    await pool.query(`UPDATE notifications SET is_read=true WHERE user_id=$1 AND is_read=false`, [req.session.user.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
