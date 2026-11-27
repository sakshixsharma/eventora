const express = require('express');
const { pool } = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', requireAuth, requireRole('admin', 'organizer'), async (req, res, next) => {
  try {
    const user = req.session.user;
    const params = [];
    let where = '';
    if (user.role === 'organizer') { params.push(user.id); where = 'WHERE e.organizer_id = $1'; }

    const registrationsPerEvent = await pool.query(
      `SELECT e.id, e.title, e.category, e.starts_at,
              COUNT(r.id) FILTER (WHERE r.status IN ('registered','attended'))::int AS registrations,
              COUNT(a.id)::int AS attendance
       FROM events e
       LEFT JOIN registrations r ON r.event_id = e.id
       LEFT JOIN attendance a ON a.event_id = e.id
       ${where}
       GROUP BY e.id
       ORDER BY e.starts_at DESC`,
      params
    );

    const categoryStats = await pool.query(
      `SELECT e.category, COUNT(*)::int AS events,
              COALESCE(SUM((SELECT COUNT(*) FROM registrations r WHERE r.event_id=e.id AND r.status IN ('registered','attended'))),0)::int AS registrations
       FROM events e ${where}
       GROUP BY e.category ORDER BY events DESC`,
      params
    );

    const totals = await pool.query(
      `SELECT COUNT(DISTINCT e.id)::int AS events,
              COUNT(r.id) FILTER (WHERE r.status IN ('registered','attended'))::int AS registrations,
              COUNT(a.id)::int AS attendance
       FROM events e
       LEFT JOIN registrations r ON r.event_id = e.id
       LEFT JOIN attendance a ON a.event_id = e.id
       ${where}`,
      params
    );

    const t = totals.rows[0] || { events: 0, registrations: 0, attendance: 0 };
    const attendanceRate = t.registrations ? Math.round((t.attendance / t.registrations) * 100) : 0;

    res.json({
      totals: { ...t, attendanceRate },
      registrationsPerEvent: registrationsPerEvent.rows,
      eventsPerCategory: categoryStats.rows,
    });
  } catch (err) { next(err); }
});

module.exports = router;
