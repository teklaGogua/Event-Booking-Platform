// Venues and categories (reference data used by the event form)
const express = require('express');
const db = require('../db');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const { idParam, venueBody, categoryBody } = require('../schemas');
const { notFound } = require('../errors');

function crud(table, bodySchema, columns) {
  const router = express.Router();
  const cols = columns.join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  const setClause = columns.map((c) => `${c} = ?`).join(', ');
  const values = (b) => columns.map((c) => b[c]);

  router.get('/', (req, res) => {
    res.json({ data: db.prepare(`SELECT * FROM ${table} ORDER BY name`).all() });
  });
  router.get('/:id', validate({ params: idParam }), (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.valid.params.id);
    if (!row) throw notFound();
    res.json({ item: row });
  });
  router.post('/', authenticate, requireRole('organizer', 'admin'), validate({ body: bodySchema }), (req, res) => {
    const info = db.prepare(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`).run(...values(req.valid.body));
    res.status(201).json({ item: db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(info.lastInsertRowid) });
  });
  router.put('/:id', authenticate, requireRole('admin'), validate({ params: idParam, body: bodySchema }), (req, res) => {
    const info = db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`).run(...values(req.valid.body), req.valid.params.id);
    if (!info.changes) throw notFound();
    res.json({ item: db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.valid.params.id) });
  });
  router.delete('/:id', authenticate, requireRole('admin'), validate({ params: idParam }), (req, res) => {
    const info = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.valid.params.id);
    if (!info.changes) throw notFound();
    res.status(204).end();
  });
  return router;
}

// Table/column names are hard-coded constants here, never user input.
module.exports = {
  venues: crud('venues', venueBody, ['name', 'address', 'city', 'capacity']),
  categories: crud('categories', categoryBody, ['name']),
};
