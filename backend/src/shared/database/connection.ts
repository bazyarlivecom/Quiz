import { Pool, PoolConfig } from 'pg';
import { env } from '../config/env';

const poolConfig: PoolConfig = {
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
  ssl: env.database.ssl ? { rejectUnauthorized: false } : false,
  max: env.database.poolMax,
  min: env.database.poolMin,
  idleTimeoutMillis: env.database.poolIdleTimeout,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

export const db = {
  query: async (text: string, params?: any[]) => {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      if (env.nodeEnv === 'development') {
        console.log('Executed query', { text, duration, rows: result.rowCount });
      }
      return result;
    } catch (error) {
      console.error('Database query error', { text, error });
      throw error;
    }
  },

  getClient: async () => {
    return await pool.connect();
  },

  end: async () => {
    await pool.end();
  },
};

export default db;

