require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-me')) {
  throw new Error('JWT_SECRET must be set to a strong value in production');
}

module.exports = {
  isProd,
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret',
  jwtExpiresInSeconds: Number(process.env.JWT_EXPIRES_IN_SECONDS) || 7200,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  dbPath: process.env.DB_PATH || './data/events.db',
};
