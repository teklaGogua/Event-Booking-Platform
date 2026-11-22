const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { register, login } = require('../schemas');
const { conflict, unauthorized } = require('../errors');
const { jwtSecret, jwtExpiresInSeconds, isProd } = require('../config');

const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProd,
  path: '/',
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: 'Too many attempts, please try again later' },
});

function issueCookie(res, user) {
  const token = jwt.sign({ sub: user.id, role: user.role }, jwtSecret, {
    algorithm: 'HS256',
    expiresIn: jwtExpiresInSeconds,
  });
  res.cookie('token', token, { ...cookieOptions, maxAge: jwtExpiresInSeconds * 1000 });
}

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

router.post('/register', authLimiter, validate({ body: register }), async (req, res) => {
  const { name, email, password, role } = req.valid.body;
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    throw conflict('An account with this email already exists');
  }
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const info = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, email, hash, role);
  const user = { id: Number(info.lastInsertRowid), name, email, role };
  issueCookie(res, user);
  res.status(201).json({ user: publicUser(user) });
});

router.post('/login', authLimiter, validate({ body: login }), async (req, res) => {
  const { email, password } = req.valid.body;
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  const ok = await bcrypt.compare(password, row ? row.password_hash : DUMMY_HASH);
  if (!row || !ok) throw unauthorized('Invalid email or password');
  issueCookie(res, row);
  res.json({ user: publicUser(row) });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.json({ message: 'Logged out' });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
