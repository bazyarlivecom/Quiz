import { runMigrations } from '../src/shared/database/migrations';
import { closeRedisClient } from '../src/infrastructure/cache/redisClient';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const migrate = async () => {
  try {
    console.log('Starting database migrations...');
    console.log(`Connecting to: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5433'}`);
    await runMigrations();
    console.log('Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await closeRedisClient();
  }
};

migrate();

