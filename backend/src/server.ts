import app from './app';
import { env } from './shared/config/env';
import { db } from './shared/database/connection';
import { getRedisClient, closeRedisClient } from './infrastructure/cache/redisClient';
import { logger } from './shared/utils/logger';

const startServer = async (): Promise<void> => {
  try {
    await db.query('SELECT NOW()');
    logger.info('Database connected successfully');

    await getRedisClient();
    logger.info('Redis connected successfully');

    app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (): Promise<void> => {
  logger.info('Shutting down gracefully...');
  await db.end();
  await closeRedisClient();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();

