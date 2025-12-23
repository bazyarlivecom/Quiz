# 🎮 Quiz Game - Complete Implementation

پروژه کامل بازی Quiz با معماری Production-ready شامل Backend و Frontend.

## 📁 ساختار پروژه

```
Quiz/
├── backend/          # Backend API (Node.js + Express + TypeScript)
├── frontend/         # Frontend (Next.js + React + TypeScript)
└── database/         # Database schema و migrations
```

## 🚀 راه‌اندازی

### پیش‌نیازها

- Node.js 20+
- MySQL 8.0+ (یا MariaDB 10.3+)
- Redis (اختیاری)

### 1. راه‌اندازی Database

```bash
# ایجاد دیتابیس
mysql -h 192.168.1.200 -u userreactpanel -p
CREATE DATABASE quiz_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# اجرای schema
mysql -h 192.168.1.200 -u userreactpanel -p quiz_game < database/schema_mysql.sql

# یا از طریق MySQL client:
# USE quiz_game;
# SOURCE database/schema_mysql.sql;
```

**نکته**: اطلاعات اتصال به دیتابیس در فایل `.env` تنظیم شده است:
- Host: 192.168.1.200
- Port: 3306
- User: userreactpanel
- Password: Aa123456

### 2. راه‌اندازی Backend

```bash
cd backend
npm install

# ایجاد فایل .env
cp .env.example .env
# ویرایش .env با تنظیمات دیتابیس

# اجرای سرور
npm run dev
```

Backend روی `http://localhost:3001` اجرا می‌شود.

### 3. راه‌اندازی Frontend

```bash
cd frontend
npm install

# ایجاد فایل .env.local (اختیاری)
# NEXT_PUBLIC_API_URL=http://localhost:3001

# اجرای سرور
npm run dev
```

Frontend روی `http://localhost:3000` اجرا می‌شود.

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - ثبت‌نام
- `POST /api/auth/login` - ورود
- `GET /api/auth/me` - اطلاعات کاربر فعلی

### Questions
- `GET /api/questions/categories` - لیست دسته‌بندی‌ها
- `GET /api/questions/random` - دریافت سوالات تصادفی
- `GET /api/questions/:id` - دریافت سوال خاص

### Quiz
- `POST /api/quiz/start` - شروع بازی
- `GET /api/quiz/:matchId/question` - دریافت سوال فعلی
- `POST /api/quiz/:matchId/answer` - ارسال پاسخ
- `GET /api/quiz/:matchId/result` - دریافت نتیجه

### Leaderboard
- `GET /api/leaderboard/global` - جدول رده‌بندی کلی
- `GET /api/leaderboard/my-rank` - رتبه کاربر
- `GET /api/leaderboard/category/:categoryId` - جدول رده‌بندی دسته

## 🎯 ویژگی‌ها

✅ احراز هویت کامل (JWT)
✅ سیستم امتیازدهی پیشرفته
✅ تایمر برای هر سوال
✅ سیستم Level و XP
✅ حالت تمرین (Practice Mode)
✅ Leaderboard
✅ دسته‌بندی سوالات
✅ محاسبه دقت پاسخ‌ها

## 🛠️ تکنولوژی‌ها

### Backend
- Node.js + Express
- TypeScript
- MySQL 8.0+
- JWT Authentication
- Zod Validation

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- Axios

## 📝 نکات مهم

1. قبل از اجرا، دیتابیس MySQL را راه‌اندازی کنید
2. فایل `.env` را در backend تنظیم کنید (اطلاعات پیش‌فرض در `.env.example` موجود است)
3. برای production، JWT_SECRET را تغییر دهید
4. Redis برای caching اختیاری است
5. برای جزئیات بیشتر تبدیل به MySQL، به `MYSQL_SETUP.md` مراجعه کنید

## 🔐 امنیت

- Password hashing با bcrypt
- JWT tokens با expiration
- Input validation با Zod
- SQL injection prevention
- CORS configuration

## 📖 مستندات

برای جزئیات بیشتر به فایل‌های زیر مراجعه کنید:
- `ARCHITECTURE_SUMMARY.md` - خلاصه معماری
- `GAME_LOGIC.md` - منطق بازی
- `TECHNICAL_DESIGN.md` - طراحی فنی

## 🎮 استفاده

1. ثبت‌نام یا ورود
2. انتخاب دسته و سطح دشواری
3. شروع بازی
4. پاسخ به سوالات
5. مشاهده نتایج و رتبه

---

**نکته**: این پروژه برای اهداف آموزشی و توسعه ایجاد شده است.
