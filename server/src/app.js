const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const authenticate = require('./middleware/auth');

// Routes
const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');
const queryRoutes = require('./routes/query.routes');
const interviewRoutes = require('./routes/interview.routes');
const mistakeRoutes = require('./routes/mistake.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const studentRoutes = require('./routes/student.routes');

const app = express();

// Trust reverse proxy (Vercel, etc.) to allow express-rate-limit to read client IPs
app.set('trust proxy', 1);

// Database initialization barrier middleware
app.use(async (req, res, next) => {
  if (app.dbInitializationPromise) {
    try {
      await app.dbInitializationPromise;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Global middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public auth routes
app.use('/auth', authRoutes);

// Protected API routes
app.use('/api/clients', authenticate, clientRoutes);
app.use('/api/queries', authenticate, queryRoutes);
app.use('/api/interviews', authenticate, interviewRoutes);
app.use('/api/mistakes', authenticate, mistakeRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/students', authenticate, studentRoutes);

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
