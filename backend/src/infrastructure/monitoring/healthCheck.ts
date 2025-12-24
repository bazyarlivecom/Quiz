import { Request, Response } from 'express';
import { db } from '../../shared/database/connection';
import { getRedisClient } from '../cache/redisClient';

export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    await db.query('SELECT 1');
    health.checks.database = 'ok';
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'error';
  }

  try {
    const redis = await getRedisClient();
    if (redis) {
      await redis.ping();
      health.checks.redis = 'ok';
    } else {
      health.checks.redis = 'not_available';
    }
  } catch (error) {
    health.checks.redis = 'error';
    // Don't mark overall status as error if Redis fails
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
};

