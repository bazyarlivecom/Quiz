# ⚡ Setup دیتابیس - همین الان!

## 🎯 مشکل شما

`psql` در PATH نیست. نگران نباشید! راه‌حل ساده است.

---

## ✅ راه‌حل (2 مرحله)

### مرحله 1: نصب pg package

```powershell
npm install
```

این دستور package `pg` را نصب می‌کند که برای اتصال به PostgreSQL نیاز است.

### مرحله 2: اجرای Setup Script

```powershell
npm run setup:db
```

**تمام!** 🎉 

این script به صورت خودکار:
- ✅ به PostgreSQL متصل می‌شود (localhost:5433)
- ✅ Database `quiz_game` را ایجاد می‌کند
- ✅ تمام جداول را می‌سازد
- ✅ Seed data را اضافه می‌کند

---

## 📋 تنظیمات فعلی

- Host: localhost
- Port: 5433
- Database: quiz_game
- Username: postgres
- Password: 4522

---

## ✅ تست اتصال

بعد از setup، برای تست:

```powershell
npm run test:db
```

---

## 🐛 اگر خطا داد

### "module 'pg' not found"
```powershell
npm install pg
```

### "could not connect to server"
- بررسی کنید PostgreSQL در حال اجرا است
- Services → PostgreSQL را چک کنید

### "password authentication failed"
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

**فقط 2 دستور: `npm install` و `npm run setup:db`** 🚀

