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

    // Ensure at least one admin user exists
    const usersCount = await db('users').count('id as count').first();
    const count = parseInt(usersCount ? (usersCount.count ?? usersCount['count(*)'] ?? 0) : 0);
    if (count === 0) {
      console.log('No users found in database. Seeding default users...');
      const bcrypt = require('bcrypt');
      const { v4: uuidv4 } = require('uuid');
      const adminPassword = await bcrypt.hash('Admin123!', 10);
      const recruiterPassword = await bcrypt.hash('Recruit123!', 10);
      const viewerPassword = await bcrypt.hash('Viewer123!', 10);
      
      await db('users').insert([
        { id: uuidv4(), username: 'admin', email: 'admin@example.com', password: adminPassword, role: 'admin' },
        { id: uuidv4(), username: 'sarah_recruiter', email: 'sarah@example.com', password: recruiterPassword, role: 'recruiter' },
        { id: uuidv4(), username: 'mike_recruiter', email: 'mike@example.com', password: recruiterPassword, role: 'recruiter' },
        { id: uuidv4(), username: 'viewer_user', email: 'viewer@example.com', password: viewerPassword, role: 'viewer' },
      ]);
      console.log('✅ Default users seeded successfully');
    }

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
