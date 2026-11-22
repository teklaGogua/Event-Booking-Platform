const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { clientOrigin } = require('./config');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const lookups = require('./routes/lookups');

const app = express();

app.use(helmet());
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/venues', lookups.venues);
app.use('/api/categories', lookups.categories);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
