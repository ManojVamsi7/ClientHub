require('dotenv').config();
const app = require('./src/app');
const db = require('./src/config/database');
const config = require('./src/config/env');

const PORT = config.port;

const start = async () => {
  try {
    // Test database connection
    await db.raw('SELECT 1');
    console.log('✅ Database connected successfully');

    // Run pending migrations
    await db.migrate.latest();
    console.log('✅ Migrations up to date');

    if (require.main === module) {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🔧 Environment: ${config.nodeEnv}`);
      });
    }
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await db.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await db.destroy();
  process.exit(0);
});

start();

module.exports = app;
