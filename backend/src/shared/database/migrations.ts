import { db } from './connection';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runMigrations = async (): Promise<void> => {
  try {
    const schemaPath = join(__dirname, '../../../database/schema_postgresql.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    await db.query(schema);
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};

