import Redis from 'ioredis';
import { env } from '../../shared/config/env';

let redisClient: Redis | null = null;

export const getRedisClient = async (): Promise<Redis> => {
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }

  redisClient = new Redis({
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password,
    tls: env.redis.tls ? {} : undefined,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis Client Connected');
  });

  return redisClient;
};

export const closeRedisClient = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

export default getRedisClient;

