# 🚀 راهنمای سریع Setup دیتابیس (بدون psql)

## ⚡ روش سریع (پیشنهادی)

### مرحله 1: نصب pg package

```powershell
npm install
```

یا فقط pg:
```powershell
npm install pg
```

### مرحله 2: اجرای Setup Script

```powershell
npm run setup:db
```

یا مستقیم:
```powershell
node database/setup_database_alternative.js
```

**تمام!** 🎉 Script به صورت خودکار:
- ✅ Database را ایجاد می‌کند
- ✅ Schema را اجرا می‌کند  
- ✅ Seed data را اضافه می‌کند

---

## 📋 تنظیمات

- **Host**: localhost
- **Port**: 5433
- **Database**: quiz_game
- **Username**: postgres
- **Password**: 4522

---

## ✅ بررسی موفقیت

بعد از اجرای script، باید پیام زیر را ببینید:

```
🎉 Database setup completed successfully!
```

---

## 🔧 اگر خطا داد

### خطا: "module 'pg' not found"
```powershell
npm install pg
```

### خطا: "could not connect to server"
- بررسی کنید PostgreSQL در حال اجرا است
- بررسی کنید پورت 5433 درست است

### خطا: "password authentication failed"
- بررسی کنید رمز 4522 درست است

---

## 📝 بعد از Setup

1. فایل `backend/.env` را ایجاد کنید (اگر ندارید)
2. Backend را اجرا کنید:
```powershell
cd backend
npm install
npm run dev
```

---

**ساده‌ترین روش: فقط `npm run setup:db` را اجرا کنید!** ✨

