import { db } from '../src/shared/database/connection';
import { closeRedisClient } from '../src/infrastructure/cache/redisClient';

export default async function teardown() {
  await db.end();
  await closeRedisClient();
}

