const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { dbPath } = require('../config');

if (dbPath !== ':memory:') {
  fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

module.exports = db;
