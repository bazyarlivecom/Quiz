import { db } from '../src/shared/database/connection';
import { readFileSync } from 'fs';
import { join } from 'path';
import { closeRedisClient } from '../src/infrastructure/cache/redisClient';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const seed = async () => {
  try {
    console.log('Starting database seeding...');
    console.log(`Connecting to: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5433'}`);
    
    const seedPath = join(__dirname, '../../database/seeds/initial_data.sql');
    
    if (!require('fs').existsSync(seedPath)) {
      console.log('Seed file not found, skipping...');
      process.exit(0);
    }
    
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

