# 🎮 Quiz Game - بازی Quiz کامل

پروژه کامل یک بازی Quiz/Trivia مشابه Quiz Of Kings با معماری Production-ready.

## 🚀 شروع سریع

برای شروع سریع، به [README_SETUP.md](./README_SETUP.md) مراجعه کنید.

```bash
# نصب dependencies
cd backend && npm install
cd ../frontend && npm install

# تنظیم database
psql quiz_game < database/schema_postgresql.sql

# اجرا
cd backend && npm run dev
cd frontend && npm run dev
```

## 📚 فهرست اسناد

### 🏗️ طراحی و معماری

1. **[TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md)**
   - طراحی فنی کامل سیستم
   - معماری سه‌لایه
   - پیشنهاد تکنولوژی‌ها
   - ماژول‌های اصلی
   - Database Schema
   - API Structure

2. **[ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md)**
   - خلاصه معماری
   - نمودارهای جریان
   - فرمول‌های محاسبه
   - API Endpoints کلیدی

3. **[PRODUCTION_STRUCTURE.md](./PRODUCTION_STRUCTURE.md)** ⭐
   - ساختار کامل پروژه Production-ready
   - ساختار پوشه‌ها با جزئیات
   - نام فایل‌ها و مسئولیت‌ها
   - ماژول‌بندی کامل

4. **[MODULE_DETAILS.md](./MODULE_DETAILS.md)** ⭐
   - جزئیات هر ماژول
   - Functions و مسئولیت‌ها
   - روابط بین ماژول‌ها
   - Data Flow

5. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**
   - ساختار اولیه پروژه
   - Dependencies پیشنهادی

6. **[QUICK_START.md](./QUICK_START.md)**
   - راهنمای سریع شروع
   - مراحل پیاده‌سازی
   - Checklist

### 🗄️ طراحی دیتابیس

7. **[database/DATABASE_SCHEMA.md](./database/DATABASE_SCHEMA.md)** ⭐
   - طراحی کامل دیتابیس
   - نمودار ERD
   - جداول و فیلدها
   - روابط بین جداول
   - Indexes و Constraints

8. **[database/schema_postgresql.sql](./database/schema_postgresql.sql)** ⭐
   - فایل SQL بهینه‌شده برای PostgreSQL
   - ویژگی‌های خاص PostgreSQL
   - Materialized Views
   - Full-Text Search
   - JSONB support

9. **[database/POSTGRESQL_FEATURES.md](./database/POSTGRESQL_FEATURES.md)**
   - توضیح ویژگی‌های PostgreSQL
   - بهینه‌سازی‌ها
   - Performance Tips

10. **[database/DATABASE_SUMMARY.md](./database/DATABASE_SUMMARY.md)**
    - خلاصه طراحی دیتابیس
    - Query های پرکاربرد
    - نکات پیاده‌سازی

### 🎮 منطق بازی

11. **[GAME_LOGIC.md](./GAME_LOGIC.md)** ⭐
    - منطق کامل بازی مرحله به مرحله
    - شروع بازی (یک نفره / دو نفره / تمرین)
    - انتخاب سوالات
    - تایمر و پاسخ‌دهی (غیرفعال در حالت تمرین)
    - محاسبه امتیاز (غیرفعال در حالت تمرین)
    - پایان بازی و تعیین برنده
    - حالت تمرین: بدون رقیب، بدون تایمر، فقط برای یادگیری
    - قابل تبدیل مستقیم به کد

12. **[GAME_LOGIC_EXAMPLES.md](./GAME_LOGIC_EXAMPLES.md)** ⭐
    - مثال‌های کد واقعی
    - Service Layer
    - Frontend Components
    - API Controllers
    - Routes

### 👤 مدیریت کاربران

13. **[USER_MANAGEMENT.md](./USER_MANAGEMENT.md)** ⭐
    - ثبت‌نام و ورود
    - احراز هویت (JWT)
    - پروفایل کاربر
    - مدیریت Level و XP
    - آمار بازی‌ها
    - امنیت پایه (Rate Limiting, Password Validation)

14. **[USER_MANAGEMENT_FRONTEND.md](./USER_MANAGEMENT_FRONTEND.md)** ⭐
    - کامپوننت‌های Frontend
    - Register/Login Pages
    - Profile Components
    - State Management
    - API Services

### 🎨 رابط کاربری

15. **[UI_FLOW.md](./UI_FLOW.md)** ⭐
    - جریان کامل رابط کاربری
    - طراحی تمام صفحات
    - المان‌های هر صفحه
    - تعامل کاربر
    - Navigation flow
    - Design principles

### ❓ مدیریت سوالات

16. **[QUESTION_MANAGEMENT.md](./QUESTION_MANAGEMENT.md)** ⭐
    - API افزودن سوال
    - API دریافت سوال تصادفی
    - API دسته‌بندی سوالات
    - اعتبارسنجی داده‌ها
    - Repository Pattern
    - Service Layer
    - Error Handling
    - Tests

### 📦 ماژول‌های کامل

17. **[USER_MODULE.md](./USER_MODULE.md)** ⭐
    - مدیریت پروفایل کاربر
    - تغییر رمز عبور
    - آمار بازی‌ها
    - تاریخچه بازی‌ها
    - Validation و Security

18. **[GAME_MODULE.md](./GAME_MODULE.md)** ⭐
    - شروع بازی (یک نفره / دو نفره / تمرین)
    - دریافت سوال فعلی
    - ارسال پاسخ
    - مدیریت Timeout (غیرفعال در حالت تمرین)
    - پایان بازی
    - حالت تمرین: بدون امتیازدهی، بدون XP، فقط یادگیری

19. **[SCORING_MODULE.md](./SCORING_MODULE.md)** ⭐
    - محاسبه امتیاز
    - محاسبه XP
    - محاسبه Level
    - فرمول‌های امتیازدهی

20. **[ONLINE_MATCH_MODULE.md](./ONLINE_MATCH_MODULE.md)** ⭐
    - ایجاد مسابقه آنلاین
    - Join match
    - Real-time status
    - WebSocket integration
    - مدیریت مسابقه دو نفره

21. **[ONLINE_GAME_SYSTEM.md](./ONLINE_GAME_SYSTEM.md)** ⭐⭐⭐
    - سیستم کامل بازی آنلاین
    - Matchmaking System (تطبیق بازیکنان با ELO Rating)
    - نوبت‌بندی بازیکنان (Turn-based & Simultaneous)
    - WebSocket Implementation کامل
    - مدیریت قطع اتصال و اتصال مجدد
    - State Management و Error Recovery
    - Scalability و Performance Optimization
    - Heartbeat Mechanism
    - Redis Pub/Sub برای چند سرور

22. **[PROGRESS_MODULE.md](./PROGRESS_MODULE.md)** ⭐
    - مدیریت XP و Level
    - به‌روزرسانی آمار کاربر
    - بررسی دستاوردها
    - دریافت دستاوردهای کاربر
    - Repository و Service کامل

23. **[LEADERBOARD_MODULE.md](./LEADERBOARD_MODULE.md)** ⭐
    - Leaderboard (All-time, Weekly, Monthly)
    - Category Leaderboard
    - دریافت رتبه کاربر
    - Redis Caching
    - Auto-refresh

24. **[MODULES_CHECKLIST.md](./MODULES_CHECKLIST.md)** ⭐
    - چک‌لیست کامل بودن همه ماژول‌ها
    - بررسی جزئیات هر ماژول
    - Status هر ماژول

### 🧪 تست‌ها

25. **[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)** ⭐⭐⭐
    - استراتژی کامل تست
    - Unit Tests (Services, Repositories, Controllers)
    - Integration Tests (API Endpoints)
    - تست منطق بازی (Game Flow, Multiplayer)
    - تست امنیت (Authentication, Authorization, Input Validation)
    - Setup و Configuration
    - Test Coverage Goals
    - مثال‌های کامل کد تست

## 🎯 ویژگی‌های سیستم

- ✅ سوالات چهارگزینه‌ای
- ✅ دسته‌بندی سوالات
- ✅ سیستم امتیازدهی پیشرفته
- ✅ تایمر برای پاسخ
- ✅ سیستم لِوِل و XP
- ✅ Leaderboard
- ✅ دستاوردها (Achievements)
- ✅ آمار و گزارش

## 🛠️ تکنولوژی‌های پیشنهادی

### Frontend
- **React 18+** با TypeScript
- **Next.js 14+** (App Router)
- **Tailwind CSS** برای styling
- **Zustand** برای state management
- **Axios** برای API calls

### Backend
- **Node.js 20+** LTS
- **Express.js** با TypeScript
- **PostgreSQL** برای database
- **Redis** برای cache و leaderboard
- **JWT** برای authentication

## 📦 ساختار ماژول‌ها

### Backend Modules
1. **Auth** - احراز هویت و مدیریت کاربر
2. **Users** - مدیریت پروفایل کاربر
3. **Questions** - مدیریت سوالات
4. **Quiz** - منطق بازی و session management
5. **Progress** - سیستم لِوِل و XP
6. **Leaderboard** - جدول رده‌بندی

### Frontend Modules
1. **Components** - UI Components
2. **Pages** - Page Components
3. **Services** - API Services
4. **Store** - State Management
5. **Hooks** - Custom Hooks

### 🚀 Production Ready

26. **[PRODUCTION_READY.md](./PRODUCTION_READY.md)** ⭐⭐⭐
    - تنظیمات کامل Production
    - بهینه‌سازی Performance (Database, Caching, CDN)
    - امنیت کامل (Security Headers, Input Validation, Authentication)
    - مقیاس‌پذیری (Load Balancing, Horizontal Scaling, Database Replication)
    - Monitoring & Logging
    - Deployment (Docker, CI/CD)
    - Backup & Recovery
    - Health Checks
    - Environment Variables
    - PM2 Configuration

## 🚀 شروع سریع

برای شروع پیاده‌سازی، به **[QUICK_START.md](./QUICK_START.md)** مراجعه کنید.

## 📋 مراحل توسعه

### Phase 1: MVP
- [ ] Setup پروژه
- [ ] Database Schema
- [ ] Authentication
- [ ] نمایش سوالات
- [ ] سیستم پاسخ‌دهی
- [ ] محاسبه امتیاز

### Phase 2: Core Features
- [ ] سیستم لِوِل و XP
- [ ] دسته‌بندی
- [ ] تایمر
- [ ] Leaderboard
- [ ] پروفایل کاربر

### Phase 3: Enhancements
- [ ] دستاوردها
- [ ] آمار و گزارش
- [ ] بهبود UI/UX
- [ ] بهینه‌سازی

## 📖 مطالعه اسناد

### برای شروع:
1. ابتدا **[ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md)** را بخوانید
2. سپس **[PRODUCTION_STRUCTURE.md](./PRODUCTION_STRUCTURE.md)** را مطالعه کنید
3. برای جزئیات ماژول‌ها، **[MODULE_DETAILS.md](./MODULE_DETAILS.md)** را ببینید

### برای پیاده‌سازی:
1. **[QUICK_START.md](./QUICK_START.md)** را دنبال کنید
2. از **[PRODUCTION_STRUCTURE.md](./PRODUCTION_STRUCTURE.md)** به عنوان راهنما استفاده کنید
3. برای دیتابیس، **[database/DATABASE_SCHEMA.md](./database/DATABASE_SCHEMA.md)** را مطالعه کنید
4. برای منطق بازی، **[GAME_LOGIC.md](./GAME_LOGIC.md)** و **[GAME_LOGIC_EXAMPLES.md](./GAME_LOGIC_EXAMPLES.md)** را ببینید

### برای دیتابیس:
1. **[database/DATABASE_SCHEMA.md](./database/DATABASE_SCHEMA.md)** - طراحی کامل
2. **[database/schema_postgresql.sql](./database/schema_postgresql.sql)** ⭐ - فایل SQL بهینه PostgreSQL
3. **[database/POSTGRESQL_FEATURES.md](./database/POSTGRESQL_FEATURES.md)** - ویژگی‌های PostgreSQL
4. **[database/DATABASE_SUMMARY.md](./database/DATABASE_SUMMARY.md)** - خلاصه

## 🎓 اصول طراحی

- **Separation of Concerns** - جداسازی مسئولیت‌ها
- **DRY** - عدم تکرار کد
- **SOLID Principles** - اصول SOLID
- **Type Safety** - استفاده کامل از TypeScript
- **Error Handling** - مدیریت خطا در تمام لایه‌ها
- **Testing** - Unit, Integration, E2E tests
- **Security** - امنیت در تمام لایه‌ها
- **Performance** - بهینه‌سازی و caching
- **Scalability** - آماده برای مقیاس‌پذیری

## 📝 نکات مهم

- تمام کدها با TypeScript نوشته می‌شوند
- از Repository Pattern برای database access استفاده می‌شود
- از Service Layer برای business logic استفاده می‌شود
- تمام inputs در Frontend و Backend validate می‌شوند
- Error handling در تمام لایه‌ها پیاده‌سازی می‌شود

## 🔗 لینک‌های مفید

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**نکته**: این پروژه در حال طراحی است. برای شروع پیاده‌سازی، از اسناد بالا استفاده کنید.

