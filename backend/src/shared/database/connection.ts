import mysql from 'mysql2/promise';
import { config } from '../config/env';
import type { PoolOptions, Pool } from 'mysql2/promise';

const poolConfig: PoolOptions = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  charset: config.database.charset,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

export const pool: Pool = mysql.createPool(poolConfig);

// Test connection (async, don't block server start)
pool.getConnection()
  .then((connection) => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch((err: Error) => {
    console.error('❌ Database connection error:', err.message);
    console.error('Please check your database configuration and ensure MariaDB is running.');
  });

export default pool;

