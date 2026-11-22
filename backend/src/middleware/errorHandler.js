const { ZodError } = require('zod');
const { ApiError } = require('../errors');

const notFoundHandler = (req, res) => res.status(404).json({ error: 'Route not found' });

function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, ...(err.details && { details: err.details }) });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  if (typeof err.code === 'string' && err.code.startsWith('SQLITE_CONSTRAINT')) {
    const msg = err.code.includes('FOREIGNKEY')
      ? 'Operation blocked: related records exist or a referenced record is missing'
      : 'A record with these values already exists';
    return res.status(409).json({ error: msg });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { errorHandler, notFoundHandler };
