# 📊 دیتابیس Quiz Game

این پوشه شامل تمام فایل‌های مربوط به طراحی و پیاده‌سازی دیتابیس است.

## 📁 فایل‌ها

### 1. **DATABASE_SCHEMA.md** ⭐
**مستندات کامل طراحی دیتابیس**
- نمودار ERD
- توضیح کامل تمام جداول
- فیلدها و نوع داده‌ها
- روابط بین جداول
- Indexes
- Constraints
- Views و Triggers

### 2. **schema_postgresql.sql** ⭐ (توصیه می‌شود)
**فایل SQL بهینه‌شده برای PostgreSQL**
- بهینه‌سازی‌های خاص PostgreSQL
- TIMESTAMPTZ برای timezone support
- JSONB برای داده‌های انعطاف‌پذیر
- Full-Text Search
- Materialized Views
- Functions و Stored Procedures
- GIN Indexes

**نحوه اجرا:**
```bash
psql -U postgres -d quiz_game -f schema_postgresql.sql
```

### 2.1. **schema.sql**
**فایل SQL پایه (سازگار با تمام DBMS)**
- CREATE TABLE statements
- Indexes
- Foreign Keys
- Constraints
- Triggers
- Views

**نحوه اجرا:**
```bash
psql -U postgres -d quiz_game -f schema.sql
```

### 3. **POSTGRESQL_FEATURES.md** ⭐
**ویژگی‌های PostgreSQL استفاده شده**
- توضیح بهینه‌سازی‌ها
- TIMESTAMPTZ, JSONB, Full-Text Search
- Materialized Views
- Performance Tips
- Monitoring Queries

### 4. **DATABASE_SUMMARY.md**
**خلاصه طراحی دیتابیس**
- لیست جداول
- روابط کلیدی
- Query های پرکاربرد
- Constraints مهم
- Indexes استراتژیک

### 5. **seeds/initial_data.sql**
**داده‌های اولیه**
- دسته‌بندی‌های پیش‌فرض
- دستاوردهای پیش‌فرض
- کاربر ادمین (اختیاری)

**نحوه اجرا:**
```bash
psql -U postgres -d quiz_game -f seeds/initial_data.sql
```

---

## 🗄️ ساختار دیتابیس

### جداول اصلی (11 جدول)

1. **users** - کاربران
2. **categories** - دسته‌بندی‌ها
3. **questions** - سوالات
4. **question_options** - گزینه‌های سوالات
5. **matches** - بازی‌ها (Sessions)
6. **match_questions** - سوالات هر بازی
7. **user_answers** - پاسخ‌های کاربران
8. **achievements** - دستاوردها
9. **user_achievements** - دستاوردهای کاربران
10. **user_stats** - آمار کاربران
11. **leaderboard** - جدول رده‌بندی (Cache)

---

## 🚀 راهنمای استفاده

### 1. ایجاد دیتابیس
```sql
CREATE DATABASE quiz_game;
```

### 2. اجرای Schema

**برای PostgreSQL (توصیه می‌شود):**
```bash
psql -U postgres -d quiz_game -f schema_postgresql.sql
```

**یا برای نسخه پایه:**
```bash
psql -U postgres -d quiz_game -f schema.sql
```

### 3. Seed Data (اختیاری)
```bash
psql -U postgres -d quiz_game -f seeds/initial_data.sql
```

### 4. بررسی جداول
```sql
\dt  -- لیست جداول
\d users  -- ساختار جدول users
```

---

## 📋 ویژگی‌های طراحی

✅ **Normalization**: 3NF (Third Normal Form)
✅ **Performance**: Indexes برای query های پرکاربرد
✅ **Data Integrity**: Foreign Keys و Constraints
✅ **Scalability**: ساختار آماده برای مقیاس‌پذیری
✅ **Security**: Constraints برای validation
✅ **Audit**: created_at و updated_at برای tracking

---

## 🔗 روابط کلیدی

```
users ──→ matches ──→ match_questions ──→ questions
users ──→ user_answers ──→ questions
users ──→ user_stats ──→ categories
questions ──→ question_options
questions ──→ categories
```

---

## 📝 نکات مهم

1. **Foreign Keys**: تمام روابط با Foreign Key تعریف شده
2. **Cascade Rules**: 
   - حذف کاربر → حذف بازی‌ها و پاسخ‌ها
   - حذف سوال → حذف گزینه‌ها
3. **Constraints**: Check constraints برای validation
4. **Indexes**: برای بهینه‌سازی query ها
5. **Triggers**: برای auto-update updated_at

---

## 🔍 Query های نمونه

### دریافت سوالات تصادفی
```sql
SELECT q.*, qo.*
FROM questions q
JOIN question_options qo ON qo.question_id = q.id
WHERE q.category_id = 1 
  AND q.difficulty = 'MEDIUM'
  AND q.is_active = true
ORDER BY RANDOM()
LIMIT 10;
```

### Leaderboard
```sql
SELECT username, level, total_score, xp
FROM users
WHERE is_active = true
ORDER BY total_score DESC, xp DESC
LIMIT 100;
```

### آمار کاربر
```sql
SELECT 
    games_played,
    correct_answers,
    wrong_answers,
    best_score,
    accuracy_rate
FROM user_stats
WHERE user_id = 1 AND category_id IS NULL;
```

---

## 📚 مستندات بیشتر

- برای جزئیات کامل: **DATABASE_SCHEMA.md**
- برای PostgreSQL: **schema_postgresql.sql** ⭐ (توصیه می‌شود)
- برای ویژگی‌های PostgreSQL: **POSTGRESQL_FEATURES.md**
- برای خلاصه: **DATABASE_SUMMARY.md**
- برای اجرای SQL پایه: **schema.sql**

---

**نکته**: قبل از استفاده در Production، حتماً backup بگیرید و در محیط Test تست کنید.

