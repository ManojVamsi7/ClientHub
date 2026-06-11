require('dotenv').config();
const path = require('path');
const isVercel = !!process.env.VERCEL;
// On Vercel, the root folder is read-only, so we must output SQLite files to /tmp/
const dbPath = isVercel ? '/tmp/db.sqlite3' : path.resolve(__dirname, 'db.sqlite3');

/**
 * Rewrites DATABASE_URL port from 5432 (Session Mode) to 6543 (Transaction Mode)
 * This enables serverless connection pooling via PgBouncer.
 * 
 * WHY: Supabase Session Mode (5432) = 15 client limit
 *      Supabase Transaction Mode (6543) = unlimited clients via PgBouncer
 */
function rewritePortToTransactionMode(databaseUrl) {
  if (!databaseUrl) return null;
  
  try {
    const url = new URL(databaseUrl);
    if (url.port === '5432') {
      url.port = '6543';
      console.log('✓ Rewrote DATABASE_URL port 5432 → 6543 (Transaction Mode)');
    }
    return url.toString();
  } catch (error) {
    console.error('Failed to rewrite DATABASE_URL:', error.message);
    throw error;
  }
}

const devConfig = {
  client: 'sqlite3',
  connection: {
    filename: dbPath
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(__dirname, 'db/migrations'),
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.resolve(__dirname, 'db/seeds'),
  },
};

module.exports = {
  development: devConfig,
  test: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: (process.env.DB_NAME || 'client_mgmt') + '_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: path.resolve(__dirname, 'db/migrations'),
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.resolve(__dirname, 'db/seeds'),
    },
  },
  production: process.env.DATABASE_URL
    ? {
        client: 'pg',
        connection: {
          connectionString: rewritePortToTransactionMode(process.env.DATABASE_URL),
          ssl: { rejectUnauthorized: false },
        },
        pool: {
          min: 0,
          max: 1,
          idleTimeoutMillis: 5000,
          acquireTimeoutMillis: 10000,
        },
        migrations: {
          directory: path.resolve(__dirname, 'db/migrations'),
          tableName: 'knex_migrations',
          disableAdvisoryLocker: true,
        },
        seeds: {
          directory: path.resolve(__dirname, 'db/seeds'),
        },
      }
    : devConfig,
};
