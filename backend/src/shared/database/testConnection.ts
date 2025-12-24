import { db } from './connection';

export async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    const result = await db.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connected successfully!');
    console.log('⏰ Current time:', result.rows[0].current_time);
    console.log('📦 PostgreSQL version:', result.rows[0].pg_version.split(',')[0]);
    
    // Test tables
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log(`\n📊 Found ${tables.rows.length} tables:`);
    tables.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    
    // Test sample queries
    console.log('\n🔍 Testing sample queries...');
    
    const userCount = await db.query('SELECT COUNT(*) as count FROM users');
    console.log(`   👥 Users: ${userCount.rows[0].count}`);
    
    const categoryCount = await db.query('SELECT COUNT(*) as count FROM categories');
    console.log(`   📁 Categories: ${categoryCount.rows[0].count}`);
    
    const questionCount = await db.query('SELECT COUNT(*) as count FROM questions');
    console.log(`   ❓ Questions: ${questionCount.rows[0].count}`);
    
    console.log('\n✅ All tests passed!');
    await db.end();
    return true;
  } catch (error: any) {
    console.error('\n❌ Database connection failed!');
    console.error('Error:', error.message);
    console.error('\n📋 Please check:');
    console.error('   1. PostgreSQL is running');
    console.error('   2. Database "quiz_game" exists');
    console.error('   3. Port 5433 is correct');
    console.error('   4. Username: postgres, Password: 4522');
    console.error('   5. Check backend/.env file');
    await db.end().catch(() => {});
    return false;
  }
}

if (require.main === module) {
  testConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
}
