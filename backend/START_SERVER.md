# راهنمای راه‌اندازی سرور

## ✅ تغییرات انجام شده

1. ✅ تبدیل به MySQL/MariaDB
2. ✅ رفع خطاهای TypeScript
3. ✅ تنظیمات دیتابیس:
   - Host: 192.168.1.200
   - Port: 3306
   - Database: quiz_game
   - User: userreactpanel
   - Password: Aa123456
   - Charset: utf8mb4

## 🚀 راه‌اندازی

### 1. نصب Dependencies

```powershell
cd backend
npm install
```

### 2. اجرای سرور

```powershell
npm run dev
```

سرور روی `http://localhost:3001` اجرا می‌شود.

### 3. تست اتصال

باز کردن مرورگر و رفتن به:
```
http://localhost:3001/health
```

باید پیام زیر را ببینید:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

## 🔍 بررسی خطاها

اگر خطایی دیدید:

1. **خطای اتصال دیتابیس**: 
   - بررسی کنید MariaDB در حال اجرا باشد
   - بررسی کنید IP و Port صحیح باشند
   - بررسی کنید user و password صحیح باشند

2. **خطای TypeScript**: 
   - `npm install` را دوباره اجرا کنید
   - `node_modules` را پاک کنید و دوباره نصب کنید

3. **خطای Port**: 
   - اگر port 3001 استفاده شده، در `.env` تغییر دهید

## 📝 فایل .env

اگر می‌خواهید تنظیمات را تغییر دهید، فایل `.env` در پوشه `backend` ایجاد کنید:

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

## ✅ وضعیت

- ✅ اتصال دیتابیس تست شده و موفق است
- ✅ خطاهای TypeScript رفع شده‌اند
- ✅ سرور آماده اجرا است



