const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const corsOptions = require('./config/cors');
const createApiLimiter = require('./config/rateLimit');
const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.set('trust proxy', 1);

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

// Keep request limits in production; local development remains unrestricted.
if (process.env.NODE_ENV === 'production') {
  app.use('/api/health', createApiLimiter());
  app.use('/api/products', createApiLimiter());
  app.use('/api/categories', createApiLimiter());
  app.use('/api/orders', createApiLimiter());
}

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
