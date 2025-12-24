const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: '4522',
  database: 'quiz_game',
};

async function testConnection() {
  const client = new Client(config);

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // تست query
    console.log('📊 Testing queries...');
    
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`✅ Found ${tables.rows.length} tables:`);
    tables.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

    // تست count
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`\n👥 Users count: ${userCount.rows[0].count}`);

    const categoryCount = await client.query('SELECT COUNT(*) as count FROM categories');
    console.log(`📁 Categories count: ${categoryCount.rows[0].count}`);

    await client.end();
    console.log('\n🎉 Database connection test passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('\n📋 Please check:');
    console.error('   1. PostgreSQL is running');
    console.error('   2. Database "quiz_game" exists');
    console.error('   3. Port 5433 is correct');
    console.error('   4. Username: postgres, Password: 4522');
    console.error('\n💡 Run: npm run setup:db');
    process.exit(1);
  }
}

testConnection();

