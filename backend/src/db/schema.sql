-- Event Booking Platform schema (SQLite)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'attendee'
                CHECK (role IN ('attendee', 'organizer', 'admin')),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS venues (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL UNIQUE,
  address    TEXT    NOT NULL,
  city       TEXT    NOT NULL,
  capacity   INTEGER NOT NULL CHECK (capacity > 0)
);

CREATE TABLE IF NOT EXISTS categories (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- One organizer -> many events; one venue -> many events; one category -> many events
CREATE TABLE IF NOT EXISTS events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT    NOT NULL,
  description  TEXT    NOT NULL DEFAULT '',
  event_date   TEXT    NOT NULL,                -- ISO 8601 date-time
  capacity     INTEGER NOT NULL CHECK (capacity > 0),
  organizer_id INTEGER NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  venue_id     INTEGER NOT NULL REFERENCES venues(id)     ON DELETE RESTRICT,
  category_id  INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_date      ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);

-- A user can have at most one row per event; cancelling flips status.
CREATE TABLE IF NOT EXISTS registrations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  status     TEXT    NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled')),
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_reg_user ON registrations(user_id);
