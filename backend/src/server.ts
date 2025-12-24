import app from './app';
import { env } from './shared/config/env';
import { db } from './shared/database/connection';
import { getRedisClient, closeRedisClient } from './infrastructure/cache/redisClient';
import { logger } from './shared/utils/logger';

const startServer = async (): Promise<void> => {
  try {
    logger.info(`Attempting to connect to database: ${env.database.host}:${env.database.port}/${env.database.name}`);
    await db.query('SELECT NOW()');
    logger.info('Database connected successfully');

    try {
      const redis = await getRedisClient();
      if (redis) {
        logger.info('Redis connected successfully');
      } else {
        logger.warn('Redis not available, continuing without cache');
      }
    } catch (error) {
      logger.warn('Redis connection failed, continuing without cache:', error);
    }

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

