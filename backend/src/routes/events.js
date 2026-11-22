const router = require('express').Router();
const db = require('../db');
const validate = require('../middleware/validate');
const { authenticate, optionalAuth, requireRole } = require('../middleware/auth');
const { idParam, eventCreate, eventUpdate, eventListQuery } = require('../schemas');
const { badRequest, forbidden, notFound, conflict } = require('../errors');

const SELECT_EVENT = `
  SELECT e.id, e.title, e.description, e.event_date, e.capacity,
         e.organizer_id, e.venue_id, e.category_id, e.created_at,
         v.name AS venue_name, v.city AS venue_city, v.address AS venue_address,
         c.name AS category_name, u.name AS organizer_name,
         (SELECT COUNT(*) FROM registrations r
           WHERE r.event_id = e.id AND r.status = 'registered') AS registered_count
  FROM events e
  JOIN venues v     ON v.id = e.venue_id
  JOIN categories c ON c.id = e.category_id
  JOIN users u      ON u.id = e.organizer_id`;

const withDerived = (row, userId) => {
  const spots_left = Math.max(row.capacity - row.registered_count, 0);
  const out = { ...row, spots_left, is_full: spots_left === 0 };
  if (userId) {
    const reg = db.prepare('SELECT status FROM registrations WHERE event_id = ? AND user_id = ?').get(row.id, userId);
    out.my_registration = reg ? reg.status : null;
  }
  return out;
};

const getEventRow = (id) => db.prepare(`${SELECT_EVENT} WHERE e.id = ?`).get(id);

// Organizers may touch only their own events; admins may touch any.
function assertCanManage(user, event) {
  if (user.role === 'admin') return;
  if (event.organizer_id !== user.id) throw forbidden('You can only manage your own events');
}

function checkVenueAndCategory(venueId, categoryId, capacity) {
  if (venueId !== undefined) {
    const venue = db.prepare('SELECT capacity FROM venues WHERE id = ?').get(venueId);
    if (!venue) throw badRequest('Venue does not exist');
    if (capacity !== undefined && capacity > venue.capacity) {
      throw badRequest(`Capacity exceeds the venue limit of ${venue.capacity}`);
    }
  }
  if (categoryId !== undefined && !db.prepare('SELECT 1 FROM categories WHERE id = ?').get(categoryId)) {
    throw badRequest('Category does not exist');
  }
}

// ---------- Public: browse ----------
router.get('/', optionalAuth, validate({ query: eventListQuery }), (req, res) => {
  const { q, category_id, venue_id, include_past, page, limit } = req.valid.query;
  const where = [];
  const params = [];
  if (q) { where.push('(e.title LIKE ? OR e.description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (category_id) { where.push('e.category_id = ?'); params.push(category_id); }
  if (venue_id) { where.push('e.venue_id = ?'); params.push(venue_id); }
  if (include_past === 'false') { where.push('e.event_date >= ?'); params.push(new Date().toISOString()); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) AS n FROM events e ${clause}`).get(...params).n;
  const rows = db
    .prepare(`${SELECT_EVENT} ${clause} ORDER BY e.event_date ASC LIMIT ? OFFSET ?`)
    .all(...params, limit, (page - 1) * limit);

  res.json({
    data: rows.map((r) => withDerived(r, req.user?.id)),
    page, limit, total, total_pages: Math.ceil(total / limit),
  });
});

// Events created by the logged-in organizer (must be declared before "/:id")
router.get('/mine', authenticate, requireRole('organizer', 'admin'), (req, res) => {
  const rows = db.prepare(`${SELECT_EVENT} WHERE e.organizer_id = ? ORDER BY e.event_date ASC`).all(req.user.id);
  res.json({ data: rows.map((r) => withDerived(r)) });
});

router.get('/:id', optionalAuth, validate({ params: idParam }), (req, res) => {
  const row = getEventRow(req.valid.params.id);
  if (!row) throw notFound('Event not found');
  res.json({ event: withDerived(row, req.user?.id) });
});

// ---------- Organizer: create / update / delete ----------
router.post('/', authenticate, requireRole('organizer', 'admin'), validate({ body: eventCreate }), (req, res) => {
  const b = req.valid.body;
  if (new Date(b.event_date) <= new Date()) throw badRequest('Event date must be in the future');
  checkVenueAndCategory(b.venue_id, b.category_id, b.capacity);
  const info = db
    .prepare(
      `INSERT INTO events (title, description, event_date, capacity, organizer_id, venue_id, category_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(b.title, b.description, b.event_date, b.capacity, req.user.id, b.venue_id, b.category_id);
  res.status(201).json({ event: withDerived(getEventRow(info.lastInsertRowid)) });
});

router.put('/:id', authenticate, requireRole('organizer', 'admin'),
  validate({ params: idParam, body: eventUpdate }), (req, res) => {
    const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.valid.params.id);
    if (!existing) throw notFound('Event not found');
    assertCanManage(req.user, existing);

    const b = req.valid.body;
    if (b.event_date && b.event_date !== existing.event_date && new Date(b.event_date) <= new Date()) {
      throw badRequest('Event date must be in the future');
    }
    const next = { ...existing, ...b };
    checkVenueAndCategory(next.venue_id, next.category_id, next.capacity);

    const registered = db
      .prepare("SELECT COUNT(*) AS n FROM registrations WHERE event_id = ? AND status = 'registered'")
      .get(existing.id).n;
    if (next.capacity < registered) {
      throw conflict(`Capacity cannot be lower than the ${registered} people already registered`);
    }

    db.prepare(
      `UPDATE events SET title = ?, description = ?, event_date = ?, capacity = ?, venue_id = ?, category_id = ?
       WHERE id = ?`
    ).run(next.title, next.description, next.event_date, next.capacity, next.venue_id, next.category_id, existing.id);
    res.json({ event: withDerived(getEventRow(existing.id)) });
  });

router.delete('/:id', authenticate, requireRole('organizer', 'admin'), validate({ params: idParam }), (req, res) => {
  const existing = db.prepare('SELECT id, organizer_id FROM events WHERE id = ?').get(req.valid.params.id);
  if (!existing) throw notFound('Event not found');
  assertCanManage(req.user, existing);
  db.prepare('DELETE FROM events WHERE id = ?').run(existing.id); // registrations cascade
  res.status(204).end();
});

// ---------- Attendee list (owner organizer or admin) ----------
router.get('/:id/attendees', authenticate, requireRole('organizer', 'admin'),
  validate({ params: idParam }), (req, res) => {
    const event = db.prepare('SELECT id, title, capacity, organizer_id FROM events WHERE id = ?').get(req.valid.params.id);
    if (!event) throw notFound('Event not found');
    assertCanManage(req.user, event);
    const attendees = db
      .prepare(
        `SELECT u.id, u.name, u.email, r.created_at AS registered_at
         FROM registrations r JOIN users u ON u.id = r.user_id
         WHERE r.event_id = ? AND r.status = 'registered'
         ORDER BY r.created_at ASC`
      )
      .all(event.id);
    res.json({ event: { id: event.id, title: event.title, capacity: event.capacity }, count: attendees.length, attendees });
  });

// ---------- Attendee: register / cancel ----------
// better-sqlite3 transactions are synchronous, so the capacity check and insert cannot interleave.
const registerTx = db.transaction((eventId, userId) => {
  const event = db.prepare('SELECT id, capacity, event_date FROM events WHERE id = ?').get(eventId);
  if (!event) throw notFound('Event not found');
  if (new Date(event.event_date) <= new Date()) throw conflict('This event has already taken place');

  const existing = db.prepare('SELECT id, status FROM registrations WHERE event_id = ? AND user_id = ?').get(eventId, userId);
  if (existing && existing.status === 'registered') throw conflict('You are already registered for this event');

  const count = db
    .prepare("SELECT COUNT(*) AS n FROM registrations WHERE event_id = ? AND status = 'registered'")
    .get(eventId).n;
  if (count >= event.capacity) throw conflict('Registration is closed: this event is full');

  if (existing) {
    db.prepare("UPDATE registrations SET status = 'registered', created_at = datetime('now') WHERE id = ?").run(existing.id);
  } else {
    db.prepare('INSERT INTO registrations (event_id, user_id) VALUES (?, ?)').run(eventId, userId);
  }
});

router.post('/:id/register', authenticate, requireRole('attendee'), validate({ params: idParam }), (req, res) => {
  registerTx(req.valid.params.id, req.user.id);
  res.status(201).json({ event: withDerived(getEventRow(req.valid.params.id), req.user.id) });
});

router.delete('/:id/register', authenticate, requireRole('attendee'), validate({ params: idParam }), (req, res) => {
  const info = db
    .prepare("UPDATE registrations SET status = 'cancelled' WHERE event_id = ? AND user_id = ? AND status = 'registered'")
    .run(req.valid.params.id, req.user.id);
  if (info.changes === 0) throw notFound('You are not registered for this event');
  res.json({ event: withDerived(getEventRow(req.valid.params.id), req.user.id) });
});

module.exports = router;
