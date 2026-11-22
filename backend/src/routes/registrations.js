const router = require('express').Router();
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// All registrations of the logged-in attendee
router.get('/me', authenticate, requireRole('attendee'), (req, res) => {
  const rows = db
    .prepare(
      `SELECT r.id, r.status, r.created_at AS registered_at,
              e.id AS event_id, e.title, e.event_date, v.name AS venue_name, v.city AS venue_city
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       JOIN venues v ON v.id = e.venue_id
       WHERE r.user_id = ?
       ORDER BY e.event_date ASC`
    )
    .all(req.user.id);
  res.json({ data: rows });
});

module.exports = router;
