# راهنمای سریع تنظیم دیتابیس

## ⚡ تنظیمات فعلی

- **Host**: localhost
- **Port**: 5433
- **Database**: quiz_game
- **Username**: postgres
- **Password**: 4522

## 🚀 راه‌اندازی سریع

### روش 1: استفاده از Script (پیشنهادی)

#### Windows (PowerShell)
```powershell
cd database
.\setup_database.ps1
```

#### Linux/Mac
```bash
cd database
chmod +x setup_database.sh
./setup_database.sh
```

### روش 2: دستی

#### مرحله 1: ایجاد Database

```bash
psql -U postgres -p 5433 -h localhost
```

در psql:
```sql
CREATE DATABASE quiz_game;
\q
```

#### مرحله 2: اجرای Schema

```bash
# Windows PowerShell
$env:PGPASSWORD="4522"
psql -U postgres -p 5433 -h localhost -d quiz_game -f database\schema_postgresql.sql

# Linux/Mac
PGPASSWORD=4522 psql -U postgres -p 5433 -h localhost -d quiz_game -f database/schema_postgresql.sql
```

#### مرحله 3: Seed Data (اختیاری)

```bash
# Windows PowerShell
psql -U postgres -p 5433 -h localhost -d quiz_game -f database\seeds\initial_data.sql

# Linux/Mac
PGPASSWORD=4522 psql -U postgres -p 5433 -h localhost -d quiz_game -f database/seeds/initial_data.sql
```

### روش 3: استفاده از npm scripts

```bash
cd backend
npm run migrate
npm run seed
```

## ✅ بررسی اتصال

```bash
# Windows PowerShell
$env:PGPASSWORD="4522"
psql -U postgres -p 5433 -h localhost -d quiz_game

# Linux/Mac
PGPASSWORD=4522 psql -U postgres -p 5433 -h localhost -d quiz_game
```

در psql:
```sql
\dt  -- لیست جداول
SELECT COUNT(*) FROM users;  -- تست query
\q
```

## 🔧 تنظیمات Backend

فایل `backend/.env` به صورت خودکار با تنظیمات زیر ایجاد شده است:

```env
DB_HOST=localhost
DB_PORT=5433
DB_NAME=quiz_game
DB_USER=postgres
DB_PASSWORD=4522
```

## 📝 نکات

1. مطمئن شوید PostgreSQL در حال اجرا است
2. پورت 5433 باید باز باشد
3. کاربر postgres باید دسترسی داشته باشد
4. برای تغییر تنظیمات، فایل `backend/.env` را ویرایش کنید

## 🐛 Troubleshooting

### خطا: "could not connect to server"
- بررسی کنید PostgreSQL در حال اجرا است
- بررسی کنید پورت 5433 درست است

### خطا: "password authentication failed"
- بررسی کنید رمز 4522 درست است
- ممکن است نیاز به تنظیم pg_hba.conf باشد

### خطا: "database does not exist"
- ابتدا database را ایجاد کنید (مرحله 1)

---

**موفق باشید!** 🎉

