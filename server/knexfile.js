require('dotenv').config();
const path = require('path');

const isVercel = !!process.env.VERCEL;
// On Vercel, the root folder is read-only, so we must output SQLite files to /tmp/
const dbPath = isVercel ? '/tmp/db.sqlite3' : path.resolve(__dirname, 'db.sqlite3');

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
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
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
      }
    : devConfig, // Fallback to SQLite in /tmp if DATABASE_URL is not set
};
