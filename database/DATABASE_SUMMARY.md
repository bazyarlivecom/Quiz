# خلاصه طراحی دیتابیس Quiz Game

## 📊 جداول اصلی (11 جدول)

### 1. **users** - کاربران
- اطلاعات کاربر، سطح، XP، امتیاز کل
- **کلید اصلی**: `id`
- **Indexes**: email, username, level, xp, total_score

### 2. **categories** - دسته‌بندی‌ها
- دسته‌بندی سوالات (تاریخ، جغرافیا، علوم، ...)
- **کلید اصلی**: `id`
- **Indexes**: name, is_active

### 3. **questions** - سوالات
- سوالات چهارگزینه‌ای
- **کلید اصلی**: `id`
- **Foreign Keys**: category_id → categories, created_by → users
- **Indexes**: category_id, difficulty, (category_id, difficulty)

### 4. **question_options** - گزینه‌های سوالات
- 4 گزینه برای هر سوال (1 صحیح، 3 غلط)
- **کلید اصلی**: `id`
- **Foreign Keys**: question_id → questions
- **Constraint**: هر سوال دقیقاً 1 پاسخ صحیح

### 5. **matches** - بازی‌ها (Sessions)
- اطلاعات هر بازی/سشن
- **کلید اصلی**: `id`
- **Foreign Keys**: user_id → users, category_id → categories
- **Status**: ACTIVE, COMPLETED, ABANDONED, TIMED_OUT

### 6. **match_questions** - سوالات هر بازی
- لیست سوالات انتخاب شده برای هر بازی
- **کلید اصلی**: `id`
- **Foreign Keys**: match_id → matches, question_id → questions
- **Unique**: (match_id, question_order)

### 7. **user_answers** - پاسخ‌های کاربران
- پاسخ کاربر به هر سوال در بازی
- **کلید اصلی**: `id`
- **Foreign Keys**: match_id → matches, question_id → questions, selected_option_id → question_options
- **Unique**: (match_id, question_id)

### 8. **achievements** - دستاوردها
- تعریف دستاوردهای بازی
- **کلید اصلی**: `id`
- **Types**: LEVEL, SCORE, GAMES, CORRECT_ANSWERS, STREAK, CATEGORY, SPECIAL

### 9. **user_achievements** - دستاوردهای کاربران
- دستاوردهای باز شده توسط کاربر
- **کلید اصلی**: (user_id, achievement_id)
- **Foreign Keys**: user_id → users, achievement_id → achievements

### 10. **user_stats** - آمار کاربران
- آمار تفصیلی کاربر بر اساس دسته
- **کلید اصلی**: `id`
- **Foreign Keys**: user_id → users, category_id → categories
- **Unique**: (user_id, category_id)
- **نکته**: category_id = NULL برای آمار کلی

### 11. **leaderboard** - جدول رده‌بندی (Cache)
- Cache برای leaderboard
- **کلید اصلی**: `id`
- **Foreign Keys**: user_id → users
- **Period Types**: ALL_TIME, WEEKLY, MONTHLY

---

## 🔗 روابط کلیدی

```
users (1) ──→ (N) matches
users (1) ──→ (N) user_answers
users (1) ──→ (N) user_achievements
users (1) ──→ (N) user_stats

categories (1) ──→ (N) questions
categories (1) ──→ (N) matches
categories (1) ──→ (N) user_stats

questions (1) ──→ (4) question_options
questions (1) ──→ (N) match_questions
questions (1) ──→ (N) user_answers

matches (1) ──→ (N) match_questions
matches (1) ──→ (N) user_answers

achievements (1) ──→ (N) user_achievements
```

---

## 📋 فیلدهای مهم

### users
- `level`: سطح کاربر (شروع از 1)
- `xp`: امتیاز تجربه
- `total_score`: مجموع امتیازهای کسب شده

### questions
- `difficulty`: EASY, MEDIUM, HARD, EXPERT
- `points`: امتیاز پایه سوال

### matches
- `status`: ACTIVE, COMPLETED, ABANDONED, TIMED_OUT
- `total_score`: مجموع امتیاز بازی
- `correct_answers`: تعداد پاسخ صحیح
- `wrong_answers`: تعداد پاسخ اشتباه

### user_answers
- `is_correct`: آیا پاسخ صحیح است
- `time_taken`: زمان پاسخ (ثانیه)
- `points_earned`: امتیاز کسب شده

---

## 🎯 Query های پرکاربرد

### 1. دریافت سوالات تصادفی
```sql
SELECT q.*, qo.*
FROM questions q
JOIN question_options qo ON qo.question_id = q.id
WHERE q.category_id = ? 
  AND q.difficulty = ?
  AND q.is_active = true
ORDER BY RANDOM()
LIMIT 10;
```

### 2. ایجاد بازی جدید
```sql
INSERT INTO matches (user_id, category_id, difficulty, questions_count)
VALUES (?, ?, ?, 10)
RETURNING id;
```

### 3. ذخیره پاسخ کاربر
```sql
INSERT INTO user_answers 
  (match_id, question_id, selected_option_id, is_correct, time_taken, points_earned)
VALUES (?, ?, ?, ?, ?, ?);
```

### 4. به‌روزرسانی امتیاز بازی
```sql
UPDATE matches 
SET total_score = total_score + ?,
    correct_answers = correct_answers + ?,
    wrong_answers = wrong_answers + ?
WHERE id = ?;
```

### 5. دریافت Leaderboard
```sql
SELECT u.id, u.username, u.level, u.total_score, u.xp
FROM users u
WHERE u.is_active = true
ORDER BY u.total_score DESC, u.xp DESC
LIMIT 100;
```

### 6. دریافت آمار کاربر
```sql
SELECT 
    us.games_played,
    us.correct_answers,
    us.wrong_answers,
    us.best_score,
    us.accuracy_rate
FROM user_stats us
WHERE us.user_id = ? AND us.category_id = ?;
```

---

## 🔒 Constraints مهم

### Check Constraints
- `users.level >= 1`
- `users.xp >= 0`
- `users.total_score >= 0`
- `questions.points > 0`
- `question_options.option_order BETWEEN 1 AND 4`
- `matches.status IN ('ACTIVE', 'COMPLETED', 'ABANDONED', 'TIMED_OUT')`
- `user_stats.accuracy_rate BETWEEN 0 AND 100`

### Unique Constraints
- `users.username` UNIQUE
- `users.email` UNIQUE
- `categories.name` UNIQUE
- `achievements.name` UNIQUE
- `(match_id, question_id)` UNIQUE در user_answers
- `(user_id, category_id)` UNIQUE در user_stats

---

## 📈 Indexes استراتژیک

### Performance Indexes
- `questions(category_id, difficulty)` - برای فیلتر سریع سوالات
- `matches(user_id, status)` - برای بازی‌های فعال کاربر
- `user_stats(user_id, best_score DESC)` - برای رتبه‌بندی
- `user_answers(match_id, question_id)` - برای جستجوی سریع پاسخ‌ها

### Foreign Key Indexes
- تمام Foreign Keys دارای index برای performance بهتر

---

## 🔄 Triggers

### Auto-update `updated_at`
- به‌روزرسانی خودکار `updated_at` در tables: users, categories, questions, user_stats

### Single Correct Answer
- اطمینان از اینکه هر سوال فقط 1 پاسخ صحیح دارد

---

## 📊 Views

### 1. `user_leaderboard_view`
- Leaderboard کاربران با رتبه

### 2. `category_statistics_view`
- آمار هر دسته (تعداد سوالات، بازی‌ها، میانگین امتیاز)

### 3. `user_progress_summary_view`
- خلاصه پیشرفت کاربر

---

## 🚀 نکات پیاده‌سازی

1. **Normalization**: دیتابیس در 3NF است
2. **Performance**: Indexes برای query های پرکاربرد
3. **Data Integrity**: Foreign Keys و Constraints
4. **Scalability**: ساختار آماده برای مقیاس‌پذیری
5. **Caching**: جدول leaderboard برای cache (یا استفاده از Redis)

---

## 📝 فایل‌های SQL

- `schema.sql` - Schema کامل دیتابیس
- `seeds/initial_data.sql` - داده‌های اولیه
- `DATABASE_SCHEMA.md` - مستندات کامل
- `DATABASE_SUMMARY.md` - این فایل (خلاصه)

---

برای جزئیات بیشتر به `DATABASE_SCHEMA.md` مراجعه کنید.

