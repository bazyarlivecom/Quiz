import { runMigrations } from '../src/shared/database/migrations';
import { closeRedisClient } from '../src/infrastructure/cache/redisClient';

const migrate = async () => {
  try {
    await runMigrations();
    console.log('Database migrations completed');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await closeRedisClient();
  }
};

migrate();

