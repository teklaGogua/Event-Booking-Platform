const bcrypt = require('bcrypt');
const db = require('./index');

const PASSWORD = 'Password123!';

const users = [
  ['Admin User', 'admin@example.com', 'admin'],
  ['Olivia Organizer', 'organizer@example.com', 'organizer'],
  ['Otto Organizer', 'organizer2@example.com', 'organizer'],
  ['Alice Attendee', 'attendee@example.com', 'attendee'],
  ['Bob Attendee', 'attendee2@example.com', 'attendee'],
];
const venues = [
  ['Grand Hall', '1 Rustaveli Ave', 'Tbilisi', 300],
  ['Tech Hub', '12 Chavchavadze St', 'Tbilisi', 80],
  ['Seaside Pavilion', '5 Boulevard', 'Batumi', 150],
];
const categories = ['Conference', 'Workshop', 'Concert', 'Meetup', 'Sports'];

const hash = bcrypt.hashSync(PASSWORD, 12);
const daysFromNow = (d) => new Date(Date.now() + d * 86400000).toISOString();

db.transaction(() => {
  for (const [n, e, r] of users) {
    db.prepare('INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(n, e, hash, r);
  }
  for (const [n, a, c, cap] of venues) {
    db.prepare('INSERT OR IGNORE INTO venues (name, address, city, capacity) VALUES (?, ?, ?, ?)').run(n, a, c, cap);
  }
  for (const c of categories) db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').run(c);

  if (db.prepare('SELECT COUNT(*) c FROM events').get().c === 0) {
    const org1 = db.prepare('SELECT id FROM users WHERE email = ?').get('organizer@example.com').id;
    const org2 = db.prepare('SELECT id FROM users WHERE email = ?').get('organizer2@example.com').id;
    const v = (n) => db.prepare('SELECT id FROM venues WHERE name = ?').get(n).id;
    const c = (n) => db.prepare('SELECT id FROM categories WHERE name = ?').get(n).id;
    const ins = db.prepare(
      'INSERT INTO events (title, description, event_date, capacity, organizer_id, venue_id, category_id) VALUES (?,?,?,?,?,?,?)'
    );
    ins.run('Web Dev Conference', 'A day of talks on modern web development.', daysFromNow(14), 200, org1, v('Grand Hall'), c('Conference'));
    ins.run('React Workshop', 'Hands-on introduction to React.', daysFromNow(7), 2, org1, v('Tech Hub'), c('Workshop'));
    ins.run('Sunset Jazz Night', 'Live jazz by the sea.', daysFromNow(21), 100, org2, v('Seaside Pavilion'), c('Concert'));
  }
})();

console.log('Seed complete. Test accounts (password for all: ' + PASSWORD + '):');
users.forEach(([, e, r]) => console.log(`  ${r.padEnd(9)} ${e}`));
