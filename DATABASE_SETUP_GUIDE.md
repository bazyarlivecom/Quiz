# راهنمای تنظیم دیتابیس (بدون psql)

## ⚠️ مشکل: psql در PATH نیست

اگر `psql` در PowerShell شناخته نمی‌شود، می‌توانید از روش‌های زیر استفاده کنید:

---

## 🚀 روش 1: استفاده از Node.js Script (پیشنهادی)

### مرحله 1: نصب pg package

```powershell
npm install
```

یا فقط در root:
```powershell
npm install pg
```

### مرحله 2: اجرای Script

```powershell
npm run setup:db
```

یا مستقیم:
```powershell
node database/setup_database_alternative.js
```

این script به صورت خودکار:
- ✅ به PostgreSQL متصل می‌شود
- ✅ Database را ایجاد می‌کند
- ✅ Schema را اجرا می‌کند
- ✅ Seed data را اضافه می‌کند (اگر وجود داشته باشد)

---

## 🔧 روش 2: پیدا کردن مسیر psql

### Windows (معمولاً)

```powershell
# مسیرهای معمول PostgreSQL
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe"
)

foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        Write-Host "Found psql at: $path"
        $env:PGPASSWORD="4522"
        & $path -U postgres -p 5433 -h localhost -c "CREATE DATABASE quiz_game;"
        break
    }
}
```

### استفاده از مسیر کامل

```powershell
$env:PGPASSWORD="4522"
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -p 5433 -h localhost -c "CREATE DATABASE quiz_game;"
```

---

## 🗄️ روش 3: استفاده از pgAdmin

1. pgAdmin را باز کنید
2. به Server → PostgreSQL (localhost:5433) متصل شوید
3. روی Databases راست کلیک کنید → Create → Database
4. نام: `quiz_game`
5. Tools → Query Tool را باز کنید
6. فایل `database/schema_postgresql.sql` را باز و اجرا کنید

---

## 📝 روش 4: استفاده از Backend Scripts

```powershell
cd backend
npm install
npm run migrate
npm run seed
```

---

## ✅ بررسی اتصال

بعد از setup، می‌توانید با Node.js script تست کنید:

```javascript
// test_connection.js
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: '4522',
  database: 'quiz_game',
});

client.connect()
  .then(() => {
    console.log('✅ Connected successfully!');
    return client.query('SELECT COUNT(*) FROM users');
  })
  .then(result => {
    console.log('Users count:', result.rows[0].count);
    client.end();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
```

اجرا:
```powershell
node test_connection.js
```

---

## 🐛 Troubleshooting

### خطا: "password authentication failed"
- بررسی کنید رمز 4522 درست است
- ممکن است نیاز به تنظیم `pg_hba.conf` باشد

### خطا: "could not connect to server"
- بررسی کنید PostgreSQL در حال اجرا است
- بررسی کنید پورت 5433 درست است
- بررسی کنید firewall اجازه می‌دهد

### خطا: "module 'pg' not found"
```powershell
npm install pg
```

---

## 📚 فایل‌های مفید

- `database/setup_database_alternative.js` - Script کامل با error handling
- `database/setup_database.js` - Script ساده
- `package.json` - npm scripts

---

**پیشنهاد: از روش 1 (Node.js Script) استفاده کنید - ساده‌ترین روش!** 🎯

