const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const corsOptions = require('./config/cors');
const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const trustProxyHops = process.env.TRUST_PROXY_HOPS === undefined
  ? 1
  : Number(process.env.TRUST_PROXY_HOPS);
if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0) {
  throw new Error('TRUST_PROXY_HOPS must be a non-negative integer');
}
app.set('trust proxy', trustProxyHops);

// Security headers
app.use(helmet());

// CORS
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1d',
  index: false,
}));

// Routes
app.use('/api', routes);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: { message: 'Delivery API is running. See /api/health for status.' },
  });
});

// 404 handler for unknown routes
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
