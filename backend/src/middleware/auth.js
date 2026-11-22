const jwt = require('jsonwebtoken');
const db = require('../db');
const { jwtSecret } = require('../config');
const { unauthorized, forbidden } = require('../errors');

const getUser = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?');

function readToken(req) {
  if (req.cookies && req.cookies.token) return req.cookies.token;
  const h = req.headers.authorization;
  if (h && h.startsWith('Bearer ')) return h.slice(7);
  return null;
}

// Returns the user row or null. The user is re-read from the DB on every request,
// so role changes and deleted accounts take effect immediately.
function resolveUser(req) {
  const token = readToken(req);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    return getUser.get(payload.sub) || null;
  } catch {
    return null;
  }
}

// 401 if not logged in
function authenticate(req, res, next) {
  const user = resolveUser(req);
  if (!user) return next(unauthorized());
  req.user = user;
  next();
}

// Attaches req.user when logged in, but lets anonymous visitors through
function optionalAuth(req, res, next) {
  req.user = resolveUser(req);
  next();
}

// 403 unless the logged-in user has one of the given roles (always checked on the server)
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(forbidden(`This action requires the role: ${roles.join(' or ')}`));
  }
  next();
};

module.exports = { authenticate, optionalAuth, requireRole };
