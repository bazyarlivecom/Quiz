import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

// Setup test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

// Mock database connection for tests
jest.mock('../src/shared/database/connection', () => ({
  db: {
    query: jest.fn(),
    getClient: jest.fn(),
    end: jest.fn(),
  },
}));

// Mock Redis client for tests
jest.mock('../src/infrastructure/cache/redisClient', () => ({
  getRedisClient: jest.fn(),
  closeRedisClient: jest.fn(),
}));

