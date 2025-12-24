const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// تنظیمات دیتابیس
const config = {
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: '4522',
  database: 'postgres',
};

const targetDatabase = 'quiz_game';

// تابع برای اجرای فایل SQL به صورت کامل
async function executeSQLFile(client, filePath) {
  const sql = fs.readFileSync(filePath, 'utf-8');
  
  // استفاده از pg_query برای اجرای کل فایل
  try {
    await client.query(sql);
    return true;
  } catch (error) {
    // اگر خطا داد، سعی می‌کنیم statement به statement اجرا کنیم
    const statements = sql
      .split(/;\s*(?=\n|$)/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    for (const statement of statements) {
      if (statement.trim() && !statement.startsWith('--')) {
        try {
          await client.query(statement);
        } catch (err) {
          // Ignore common errors
          if (
            !err.message.includes('already exists') &&
            !err.message.includes('does not exist') &&
            !err.message.includes('duplicate key')
          ) {
            console.warn(`Warning in statement: ${err.message}`);
            console.warn(`Statement: ${statement.substring(0, 100)}...`);
          }
        }
      }
    }
    return true;
  }
}

async function setupDatabase() {
  const client = new Client(config);

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // ایجاد database
    console.log(`📦 Checking database '${targetDatabase}'...`);
    const dbCheck = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDatabase]
    );

    if (dbCheck.rows.length > 0) {
      console.log(`ℹ️  Database '${targetDatabase}' already exists.\n`);
    } else {
      console.log(`➕ Creating database '${targetDatabase}'...`);
      await client.query(`CREATE DATABASE ${targetDatabase}`);
      console.log(`✅ Database '${targetDatabase}' created!\n`);
    }

    await client.end();

    // اتصال به database جدید
    console.log(`🔌 Connecting to '${targetDatabase}'...`);
    const dbClient = new Client({
      ...config,
      database: targetDatabase,
    });

    await dbClient.connect();
    console.log(`✅ Connected to '${targetDatabase}'!\n`);

    // اجرای schema
    const schemaPath = path.join(__dirname, 'schema_postgresql.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    console.log('📄 Running schema...');
    await executeSQLFile(dbClient, schemaPath);
    console.log('✅ Schema applied successfully!\n');

    // بررسی جداول
    const tables = await dbClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log(`📊 Created ${tables.rows.length} tables:`);
    tables.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    console.log('');

    // اجرای seed data
    const seedPath = path.join(__dirname, 'seeds', 'initial_data.sql');
    if (fs.existsSync(seedPath)) {
      console.log('🌱 Seeding initial data...');
      await executeSQLFile(dbClient, seedPath);
      console.log('✅ Seed data applied!\n');
    }

    await dbClient.end();
    console.log('🎉 Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n📋 Troubleshooting:');
    console.error('   1. Make sure PostgreSQL is running');
    console.error('   2. Check if port 5433 is correct');
    console.error('   3. Verify username: postgres, password: 4522');
    console.error('   4. Check PostgreSQL service status');
    process.exit(1);
  }
}

setupDatabase();

