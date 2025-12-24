import Redis from 'ioredis';
import { env } from '../../shared/config/env';

let redisClient: Redis | null = null;
let redisAvailable = false;
let connectionAttempted = false;

export const getRedisClient = async (): Promise<Redis | null> => {
  // If we already attempted and failed, don't try again
  if (connectionAttempted && !redisAvailable) {
    return null;
  }

  // If client exists and is ready, return it
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }

  // If client exists but not ready, return null
  if (redisClient && redisClient.status !== 'ready') {
    return null;
  }

  // Mark that we're attempting connection
  connectionAttempted = true;

  try {
    redisClient = new Redis({
      host: env.redis.host,
      port: env.redis.port,
      password: env.redis.password || undefined,
      tls: env.redis.tls ? {} : undefined,
      retryStrategy: () => {
        // Don't retry - fail fast
        return null;
      },
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 2000,
    });

    redisClient.on('error', (err) => {
      // Only log if not already marked as unavailable
      if (redisAvailable) {
        console.error('Redis Client Error', err);
      }
      redisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
      redisAvailable = true;
    });

    redisClient.on('close', () => {
      redisAvailable = false;
    });

    // Try to connect with timeout
    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 2000)
      ),
    ]);

    redisAvailable = true;
    return redisClient;
  } catch (error) {
    // Connection failed - mark as unavailable
    redisAvailable = false;
    if (redisClient) {
      try {
        await redisClient.quit();
      } catch {
        // Ignore quit errors
      }
      redisClient = null;
    }
    return null;
  }
};

export const closeRedisClient = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch (error) {
      // Ignore errors on close
    }
    redisClient = null;
    redisAvailable = false;
  }
};

export const isRedisAvailable = (): boolean => {
  return redisAvailable;
};

export default getRedisClient;

