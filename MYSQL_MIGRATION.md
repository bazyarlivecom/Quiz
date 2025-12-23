# راهنمای تبدیل به MySQL

پروژه از PostgreSQL به MySQL تبدیل شده است. تغییرات اعمال شده:

## تغییرات اصلی

### 1. Package Dependencies
- `pg` → `mysql2`
- `@types/pg` → `@types/mysql2`

### 2. Database Connection
- استفاده از `mysql2/promise` به جای `pg`
- تغییر Pool configuration

### 3. Query Syntax
- `$1, $2` → `?` (parameterized queries)
- `result.rows` → `[rows]` (array destructuring)
- `RETURNING *` → separate SELECT query
- `CURRENT_TIMESTAMP` → `NOW()`
- `RANDOM()` → `RAND()`

### 4. Configuration
- Default host: `192.168.1.200`
- Default port: `3306`
- Default user: `userreactpanel`
- Default password: `Aa123456`
- Charset: `utf8mb4`

## نکات مهم

1. **Database Schema**: باید schema را برای MySQL ایجاد کنید (PostgreSQL schema نیاز به تبدیل دارد)

2. **Data Types**:
   - `SERIAL` → `AUTO_INCREMENT`
   - `TIMESTAMPTZ` → `DATETIME` یا `TIMESTAMP`
   - `JSONB` → `JSON`

3. **Functions**: برخی توابع PostgreSQL در MySQL متفاوت هستند

## مراحل راه‌اندازی

1. نصب dependencies جدید:
```bash
cd backend
npm install
```

2. ایجاد دیتابیس MySQL:
```sql
CREATE DATABASE quiz_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. اجرای schema (نیاز به تبدیل از PostgreSQL به MySQL)

4. تنظیم `.env` با اطلاعات دیتابیس

5. اجرای سرور:
```bash
npm run dev
```

## Schema Conversion

برای تبدیل schema از PostgreSQL به MySQL، باید:
- تمام `SERIAL` را به `AUTO_INCREMENT` تبدیل کنید
- `TIMESTAMPTZ` را به `DATETIME` تبدیل کنید
- `JSONB` را به `JSON` تبدیل کنید
- توابع PostgreSQL را به MySQL معادل تبدیل کنید



