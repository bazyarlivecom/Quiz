import { db } from '../src/shared/database/connection';
import { readFileSync } from 'fs';
import { join } from 'path';
import { closeRedisClient } from '../src/infrastructure/cache/redisClient';

const seed = async () => {
  try {
    const seedPath = join(__dirname, '../../database/seeds/initial_data.sql');
    const seedData = readFileSync(seedPath, 'utf-8');
    
    await db.query(seedData);
    console.log('Seed data inserted successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await closeRedisClient();
  }
};

seed();

