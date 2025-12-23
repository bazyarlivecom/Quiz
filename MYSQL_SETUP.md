# راه‌اندازی پروژه با MySQL

## ✅ تغییرات انجام شده

پروژه از PostgreSQL به MySQL تبدیل شده است. تمام تغییرات اعمال شده:

### 1. Dependencies
- ✅ `pg` → `mysql2`
- ✅ `@types/pg` → `@types/mysql2`

### 2. Database Connection
- ✅ استفاده از `mysql2/promise`
- ✅ تنظیمات connection برای MySQL

### 3. Query Syntax
تمام query ها به MySQL syntax تبدیل شده‌اند:
- ✅ `$1, $2` → `?`
- ✅ `result.rows` → `[rows]`
- ✅ `RETURNING *` → separate SELECT
- ✅ `CURRENT_TIMESTAMP` → `NOW()`
- ✅ `RANDOM()` → `RAND()`

### 4. Configuration
تنظیمات پیش‌فرض:
- Host: `192.168.1.200`
- Port: `3306`
- User: `userreactpanel`
- Password: `Aa123456`
- Charset: `utf8mb4`

## 🚀 مراحل راه‌اندازی

### 1. نصب Dependencies

```bash
cd backend
npm install
```

### 2. ایجاد دیتابیس MySQL

```sql
CREATE DATABASE quiz_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. اجرای Schema

```bash
mysql -h 192.168.1.200 -u userreactpanel -p quiz_game < database/schema_mysql.sql
```

یا از طریق MySQL client:
```sql
USE quiz_game;
SOURCE database/schema_mysql.sql;
```

### 4. تنظیم Environment Variables

فایل `.env` در پوشه `backend` ایجاد کنید:

```env
PORT=3001
NODE_ENV=development

DB_HOST=192.168.1.200
DB_PORT=3306
DB_NAME=quiz_game
DB_USER=userreactpanel
DB_PASSWORD=Aa123456
DB_CHARSET=utf8mb4

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
```

### 5. اجرای Backend

```bash
cd backend
npm run dev
```

## 📝 تفاوت‌های MySQL و PostgreSQL

### Data Types
- `SERIAL` → `AUTO_INCREMENT`
- `TIMESTAMPTZ` → `DATETIME`
- `JSONB` → `JSON`
- `TEXT[]` → `JSON` (برای arrays)

### Functions
- `RANDOM()` → `RAND()`
- `CURRENT_TIMESTAMP` → `NOW()`
- `ROW_NUMBER() OVER()` → در MySQL 8.0+ پشتیبانی می‌شود

### Query Syntax
- Parameterized queries: `$1, $2` → `?`
- Result handling: `result.rows` → `[rows]`
- RETURNING clause: نیاز به separate SELECT

## ✅ فایل‌های تغییر یافته

### Backend
- `backend/package.json` - Dependencies
- `backend/src/shared/config/env.ts` - Configuration
- `backend/src/shared/database/connection.ts` - Connection
- تمام Repository ها:
  - `backend/src/modules/auth/repositories/userRepository.ts`
  - `backend/src/modules/questions/repositories/questionRepository.ts`
  - `backend/src/modules/questions/repositories/categoryRepository.ts`
  - `backend/src/modules/quiz/repositories/quizSessionRepository.ts`
  - `backend/src/modules/quiz/repositories/quizAnswerRepository.ts`
  - `backend/src/modules/progress/services/xpService.ts`
  - `backend/src/modules/leaderboard/services/leaderboardService.ts`
  - `backend/src/modules/quiz/services/quizService.ts`

### Database
- `database/schema_mysql.sql` - Schema برای MySQL

## 🔍 تست اتصال

برای تست اتصال به دیتابیس:

```bash
cd backend
npm run dev
```

اگر اتصال موفق باشد، پیام زیر نمایش داده می‌شود:
```
✅ Database connected successfully
🚀 Server running on port 3001
```

## ⚠️ نکات مهم

1. **Charset**: از `utf8mb4` استفاده می‌کنیم برای پشتیبانی کامل از Unicode
2. **Engine**: از `InnoDB` استفاده می‌کنیم برای foreign keys و transactions
3. **JSON**: MySQL 5.7+ از JSON پشتیبانی می‌کند
4. **Window Functions**: MySQL 8.0+ از `ROW_NUMBER()` پشتیبانی می‌کند

## 🐛 Troubleshooting

### خطای اتصال
- بررسی کنید که MySQL server در حال اجرا باشد
- بررسی کنید که IP و Port صحیح باشند
- بررسی کنید که user و password صحیح باشند

### خطای Syntax
- مطمئن شوید که از MySQL 8.0+ استفاده می‌کنید
- بررسی کنید که charset `utf8mb4` باشد

### خطای Foreign Key
- مطمئن شوید که از `InnoDB` engine استفاده می‌کنید
- بررسی کنید که foreign keys به درستی تعریف شده باشند

---

**نکته**: تمام کدها به MySQL تبدیل شده‌اند و آماده استفاده هستند.



