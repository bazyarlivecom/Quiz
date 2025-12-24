# دستورالعمل تنظیم دیتابیس

## ✅ تنظیمات اعمال شده

تنظیمات دیتابیس به صورت زیر تنظیم شده است:

- **Host**: localhost
- **Port**: 5433
- **Database**: quiz_game
- **Username**: postgres
- **Password**: 4522

## 📝 مراحل راه‌اندازی

### 1. ایجاد فایل .env در Backend

فایل `backend/.env` را ایجاد کنید با محتوای زیر:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5433
DB_NAME=quiz_game
DB_USER=postgres
DB_PASSWORD=4522
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
CORS_ORIGIN=http://localhost:3001
```

### 2. ایجاد Database

```powershell
# در PowerShell
$env:PGPASSWORD="4522"
psql -U postgres -p 5433 -h localhost -c "CREATE DATABASE quiz_game;"
```

یا در psql:
```sql
psql -U postgres -p 5433 -h localhost
CREATE DATABASE quiz_game;
\q
```

### 3. اجرای Schema

```powershell
# در PowerShell
$env:PGPASSWORD="4522"
psql -U postgres -p 5433 -h localhost -d quiz_game -f database\schema_postgresql.sql
```

یا استفاده از script:
```powershell
cd database
.\setup_database.ps1
```

### 4. تست اتصال

```powershell
$env:PGPASSWORD="4522"
psql -U postgres -p 5433 -h localhost -d quiz_game
```

در psql:
```sql
\dt  -- لیست جداول
\q
```

## 🚀 اجرای Backend

```bash
cd backend
npm install
npm run dev
```

Backend باید به دیتابیس متصل شود.

## 📚 مستندات بیشتر

- [QUICK_DATABASE_SETUP.md](./QUICK_DATABASE_SETUP.md) - راهنمای سریع
- [database/README.md](./database/README.md) - مستندات دیتابیس

