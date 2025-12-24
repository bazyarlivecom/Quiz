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
  connectionTimeoutMillis: 10000, // Increased to 10 seconds
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
    } catch (error: any) {
      console.error('Database query error', { text, error });
      
      // Provide helpful error messages for common connection issues
      if (error.code === 'ECONNREFUSED') {
        console.error('\n❌ Database connection refused!');
        console.error('Please check:');
        console.error(`  1. PostgreSQL is running on ${env.database.host}:${env.database.port}`);
        console.error(`  2. Database "${env.database.name}" exists`);
        console.error(`  3. User "${env.database.user}" has access`);
        console.error(`  4. Port ${env.database.port} is correct (default is 5432, but this config uses ${env.database.port})`);
        console.error('\nTo start PostgreSQL:');
        console.error('  Windows: Check Services or run: net start postgresql-x64-XX');
        console.error('  Or use Docker: docker-compose up -d postgres');
      } else if (error.code === 'ENOTFOUND') {
        console.error(`\n❌ Database host "${env.database.host}" not found!`);
      } else if (error.code === 'ETIMEDOUT') {
        console.error(`\n❌ Database connection timeout to ${env.database.host}:${env.database.port}`);
        console.error('The database server may be slow or unreachable.');
      } else if (error.code === '28P01') {
        console.error('\n❌ Authentication failed!');
        console.error(`Please check username "${env.database.user}" and password.`);
      } else if (error.code === '3D000') {
        console.error(`\n❌ Database "${env.database.name}" does not exist!`);
        console.error('Please create it first or run: node database/setup_database.js');
      }
      
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

