process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret';

const { test, before, describe } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const request = require('supertest');
const db = require('../src/db');
const app = require('../src/app');

const PW = 'Password123!';
const future = (d) => new Date(Date.now() + d * 86400000).toISOString();
const agents = {};
let venueId, categoryId;

async function loginAgent(email) {
  const a = request.agent(app);
  const res = await a.post('/api/auth/login').send({ email, password: PW });
  assert.equal(res.status, 200, `login failed for ${email}`);
  return a;
}

before(async () => {
  const hash = bcrypt.hashSync(PW, 4);
  const ins = db.prepare('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)');
  ins.run('Admin', 'admin@t.com', hash, 'admin');
  ins.run('Org One', 'org1@t.com', hash, 'organizer');
  ins.run('Org Two', 'org2@t.com', hash, 'organizer');
  ins.run('Att One', 'att1@t.com', hash, 'attendee');
  ins.run('Att Two', 'att2@t.com', hash, 'attendee');
  venueId = Number(db.prepare('INSERT INTO venues (name,address,city,capacity) VALUES (?,?,?,?)').run('Hall', 'x st', 'Tbilisi', 100).lastInsertRowid);
  categoryId = Number(db.prepare('INSERT INTO categories (name) VALUES (?)').run('Conf').lastInsertRowid);
  for (const k of ['admin', 'org1', 'org2', 'att1', 'att2']) agents[k] = await loginAgent(`${k}@t.com`);
});

const eventBody = (o = {}) => ({
  title: 'Test Event', description: 'desc', event_date: future(5), capacity: 2, venue_id: venueId, category_id: categoryId, ...o,
});
const createEvent = async (agent = agents.org1, o) => (await agent.post('/api/events').send(eventBody(o))).body.event;

describe('authentication', () => {
  test('register hashes password with bcrypt and sets httpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'New User', email: 'New@T.com', password: PW });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.role, 'attendee');
    assert.match(res.headers['set-cookie'][0], /HttpOnly/);
    const row = db.prepare('SELECT password_hash FROM users WHERE email = ?').get('new@t.com');
    assert.ok(row.password_hash.startsWith('$2'), 'bcrypt hash');
    assert.notEqual(row.password_hash, PW);
  });
  test('cannot self-register as admin', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Evil', email: 'evil@t.com', password: PW, role: 'admin' });
    assert.equal(res.status, 400);
  });
  test('duplicate email -> 409, weak password -> 400', async () => {
    assert.equal((await request(app).post('/api/auth/register').send({ name: 'Dup', email: 'att1@t.com', password: PW })).status, 409);
    const weak = await request(app).post('/api/auth/register').send({ name: 'Weak', email: 'w@t.com', password: 'short' });
    assert.equal(weak.status, 400);
    assert.ok(weak.body.details.length > 0);
  });
  test('wrong password and unknown email give the same 401', async () => {
    const a = await request(app).post('/api/auth/login').send({ email: 'att1@t.com', password: 'nope' });
    const b = await request(app).post('/api/auth/login').send({ email: 'ghost@t.com', password: 'nope' });
    assert.equal(a.status, 401);
    assert.deepEqual(a.body, b.body);
  });
  test('/me requires login; logout clears cookie', async () => {
    assert.equal((await request(app).get('/api/auth/me')).status, 401);
    const a = await loginAgent('att2@t.com');
    assert.equal((await a.get('/api/auth/me')).status, 200);
    await a.post('/api/auth/logout');
    assert.equal((await a.get('/api/auth/me')).status, 401);
  });
  test('tampered token rejected', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'token=abc.def.ghi');
    assert.equal(res.status, 401);
  });
});

describe('event CRUD and validation', () => {
  test('organizer creates, reads, updates, deletes own event', async () => {
    const ev = await createEvent();
    assert.ok(ev.id);
    assert.equal(ev.organizer_id, 2);
    assert.equal((await request(app).get(`/api/events/${ev.id}`)).status, 200);
    const up = await agents.org1.put(`/api/events/${ev.id}`).send({ title: 'Renamed event' });
    assert.equal(up.status, 200);
    assert.equal(up.body.event.title, 'Renamed event');
    assert.equal(up.body.event.description, 'desc', 'untouched fields preserved');
    assert.equal((await agents.org1.delete(`/api/events/${ev.id}`)).status, 204);
    assert.equal((await request(app).get(`/api/events/${ev.id}`)).status, 404);
  });
  test('server-side validation rejects bad input', async () => {
    const bad = [
      { title: 'ab' }, { capacity: 0 }, { capacity: 'ten' }, { capacity: 1.5 },
      { event_date: 'not-a-date' }, { event_date: future(-2) }, { venue_id: 9999 }, { category_id: 9999 },
      { capacity: 101 }, // exceeds venue capacity
    ];
    for (const o of bad) {
      const res = await agents.org1.post('/api/events').send(eventBody(o));
      assert.equal(res.status, 400, JSON.stringify(o));
    }
  });
  test('SQL injection in search is harmless (parameterized)', async () => {
    const res = await request(app).get('/api/events').query({ q: "'; DROP TABLE events; --" });
    assert.equal(res.status, 200);
    assert.equal((await request(app).get('/api/events')).status, 200);
  });
  test('public list works with pagination', async () => {
    const res = await request(app).get('/api/events?limit=2&page=1');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.equal((await request(app).get('/api/events?limit=500')).status, 400);
  });
});

describe('forbidden actions', () => {
  test('anonymous cannot create/update/delete events', async () => {
    const ev = await createEvent();
    assert.equal((await request(app).post('/api/events').send(eventBody())).status, 401);
    assert.equal((await request(app).put(`/api/events/${ev.id}`).send({ title: 'Hacked' })).status, 401);
    assert.equal((await request(app).delete(`/api/events/${ev.id}`)).status, 401);
  });
  test('attendee cannot create/update/delete events or see attendee lists', async () => {
    const ev = await createEvent();
    assert.equal((await agents.att1.post('/api/events').send(eventBody())).status, 403);
    assert.equal((await agents.att1.put(`/api/events/${ev.id}`).send({ title: 'Hacked' })).status, 403);
    assert.equal((await agents.att1.delete(`/api/events/${ev.id}`)).status, 403);
    assert.equal((await agents.att1.get(`/api/events/${ev.id}/attendees`)).status, 403);
  });
  test("organizer cannot edit, delete or list another organizer's event", async () => {
    const ev = await createEvent(agents.org1);
    assert.equal((await agents.org2.put(`/api/events/${ev.id}`).send({ title: 'Hijacked' })).status, 403);
    assert.equal((await agents.org2.delete(`/api/events/${ev.id}`)).status, 403);
    assert.equal((await agents.org2.get(`/api/events/${ev.id}/attendees`)).status, 403);
    const after = await request(app).get(`/api/events/${ev.id}`);
    assert.equal(after.body.event.title, 'Test Event');
  });
  test('cannot spoof organizer_id in body', async () => {
    const res = await agents.org2.post('/api/events').send({ ...eventBody(), organizer_id: 2 });
    assert.equal(res.body.event.organizer_id, 3);
  });
  test('organizer and admin cannot register as attendees; attendee cannot manage venues', async () => {
    const ev = await createEvent();
    assert.equal((await agents.org2.post(`/api/events/${ev.id}/register`)).status, 403);
    assert.equal((await agents.att1.post('/api/venues').send({ name: 'V', address: 'a b', city: 'cc', capacity: 5 })).status, 403);
    assert.equal((await agents.org1.delete(`/api/venues/${venueId}`)).status, 403);
    assert.equal((await agents.att1.delete(`/api/categories/${categoryId}`)).status, 403);
  });
  test('admin can manage any event', async () => {
    const ev = await createEvent(agents.org1);
    assert.equal((await agents.admin.put(`/api/events/${ev.id}`).send({ title: 'Admin edit' })).status, 200);
    assert.equal((await agents.admin.delete(`/api/events/${ev.id}`)).status, 204);
  });
  test('venue in use cannot be deleted (FK restrict -> 409)', async () => {
    await createEvent();
    assert.equal((await agents.admin.delete(`/api/venues/${venueId}`)).status, 409);
  });
});

describe('registration, capacity and attendee list', () => {
  test('register, duplicate blocked, cancel, re-register', async () => {
    const ev = await createEvent(agents.org1, { capacity: 5 });
    const r1 = await agents.att1.post(`/api/events/${ev.id}/register`);
    assert.equal(r1.status, 201);
    assert.equal(r1.body.event.registered_count, 1);
    assert.equal(r1.body.event.my_registration, 'registered');
    assert.equal((await agents.att1.post(`/api/events/${ev.id}/register`)).status, 409);
    const c = await agents.att1.delete(`/api/events/${ev.id}/register`);
    assert.equal(c.status, 200);
    assert.equal(c.body.event.registered_count, 0);
    assert.equal((await agents.att1.delete(`/api/events/${ev.id}/register`)).status, 404);
    assert.equal((await agents.att1.post(`/api/events/${ev.id}/register`)).status, 201);
  });
  test('registration closes at capacity and reopens after a cancellation', async () => {
    const ev = await createEvent(agents.org1, { capacity: 1 });
    assert.equal((await agents.att1.post(`/api/events/${ev.id}/register`)).status, 201);
    const full = await agents.att2.post(`/api/events/${ev.id}/register`);
    assert.equal(full.status, 409);
    assert.match(full.body.error, /full/i);
    assert.equal((await request(app).get(`/api/events/${ev.id}`)).body.event.is_full, true);
    await agents.att1.delete(`/api/events/${ev.id}/register`);
    assert.equal((await agents.att2.post(`/api/events/${ev.id}/register`)).status, 201);
  });
  test('owner sees attendee list; capacity cannot drop below registered count', async () => {
    const ev = await createEvent(agents.org1, { capacity: 3 });
    await agents.att1.post(`/api/events/${ev.id}/register`);
    await agents.att2.post(`/api/events/${ev.id}/register`);
    const list = await agents.org1.get(`/api/events/${ev.id}/attendees`);
    assert.equal(list.status, 200);
    assert.equal(list.body.count, 2);
    assert.deepEqual(list.body.attendees.map((a) => a.email).sort(), ['att1@t.com', 'att2@t.com']);
    assert.ok(!JSON.stringify(list.body).includes('password'));
    assert.equal((await agents.org1.put(`/api/events/${ev.id}`).send({ capacity: 1 })).status, 409);
  });
  test('deleting an event removes its registrations; /registrations/me lists mine', async () => {
    const ev = await createEvent(agents.org1, { capacity: 3 });
    await agents.att1.post(`/api/events/${ev.id}/register`);
    const mine = await agents.att1.get('/api/registrations/me');
    assert.equal(mine.status, 200);
    assert.ok(mine.body.data.some((r) => r.event_id === ev.id));
    await agents.org1.delete(`/api/events/${ev.id}`);
    assert.equal(db.prepare('SELECT COUNT(*) n FROM registrations WHERE event_id = ?').get(ev.id).n, 0);
  });
  test('unknown event -> 404, bad id -> 400', async () => {
    assert.equal((await agents.att1.post('/api/events/99999/register')).status, 404);
    assert.equal((await request(app).get('/api/events/abc')).status, 400);
  });
});
