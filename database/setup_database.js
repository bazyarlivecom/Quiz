const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// تنظیمات دیتابیس
const config = {
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: '4522',
  database: 'postgres', // برای ایجاد database جدید
};

const targetDatabase = 'quiz_game';

async function setupDatabase() {
  const client = new Client(config);

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected successfully!');

    // بررسی وجود database
    console.log(`Checking if database '${targetDatabase}' exists...`);
    const dbCheck = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDatabase]
    );

    if (dbCheck.rows.length > 0) {
      console.log(`Database '${targetDatabase}' already exists.`);
    } else {
      console.log(`Creating database '${targetDatabase}'...`);
      await client.query(`CREATE DATABASE ${targetDatabase}`);
      console.log(`Database '${targetDatabase}' created successfully!`);
    }

    await client.end();

    // اتصال به database جدید
    console.log(`Connecting to '${targetDatabase}'...`);
    const dbClient = new Client({
      ...config,
      database: targetDatabase,
    });

    await dbClient.connect();
    console.log(`Connected to '${targetDatabase}'!`);

    // اجرای schema
    console.log('Running schema...');
    const schemaPath = path.join(__dirname, 'schema_postgresql.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error(`Schema file not found: ${schemaPath}`);
      process.exit(1);
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // تقسیم schema به statements (PostgreSQL نیاز به اجرای جداگانه دارد)
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await dbClient.query(statement);
        } catch (error) {
          // Ignore errors for statements like CREATE EXTENSION IF NOT EXISTS
          if (!error.message.includes('already exists')) {
            console.warn(`Warning: ${error.message}`);
          }
        }
      }
    }

    console.log('Schema applied successfully!');

    // اجرای seed data (اختیاری)
    const seedPath = path.join(__dirname, 'seeds', 'initial_data.sql');
    if (fs.existsSync(seedPath)) {
      console.log('Seeding initial data...');
      const seedData = fs.readFileSync(seedPath, 'utf-8');
      const seedStatements = seedData
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of seedStatements) {
        if (statement.trim()) {
          try {
            await dbClient.query(statement);
          } catch (error) {
            console.warn(`Warning: ${error.message}`);
          }
        }
      }
      console.log('Seed data applied successfully!');
    } else {
      console.log('Seed file not found, skipping...');
    }

    await dbClient.end();
    console.log('\n✅ Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. PostgreSQL is running');
    console.error('2. Port 5433 is correct');
    console.error('3. Username and password are correct');
    process.exit(1);
  }
}

setupDatabase();

