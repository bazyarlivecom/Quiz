# ویژگی‌های PostgreSQL در طراحی دیتابیس

این سند توضیح می‌دهد که چگونه از ویژگی‌های خاص PostgreSQL برای بهینه‌سازی استفاده شده است.

## 🚀 ویژگی‌های استفاده شده

### 1. **TIMESTAMPTZ به جای TIMESTAMP**

```sql
created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
```

**مزایا:**
- پشتیبانی از Timezone
- تبدیل خودکار به UTC
- مناسب برای برنامه‌های بین‌المللی

**تفاوت:**
- `TIMESTAMP`: بدون timezone
- `TIMESTAMPTZ`: با timezone (توصیه می‌شود)

---

### 2. **JSONB برای داده‌های انعطاف‌پذیر**

```sql
metadata JSONB DEFAULT '{}'::jsonb
```

**استفاده در:**
- `users.metadata`: اطلاعات اضافی کاربر
- `questions.metadata`: متادیتای سوالات
- `matches.metadata`: اطلاعات اضافی بازی

**مزایا:**
- ذخیره داده‌های ساختارنیافته
- Query کردن با JSON operators
- Indexing با GIN indexes

**مثال Query:**
```sql
-- جستجو در metadata
SELECT * FROM users 
WHERE metadata->>'preferred_language' = 'fa';

-- Index برای performance
CREATE INDEX idx_users_metadata_gin ON users USING GIN (metadata);
```

---

### 3. **Full-Text Search**

```sql
-- Index برای جستجوی متن
CREATE INDEX idx_questions_text_search ON questions 
USING GIN (to_tsvector('english', question_text));
```

**استفاده:**
- جستجوی سریع در متن سوالات
- پشتیبانی از زبان‌های مختلف
- Ranking نتایج

**مثال Query:**
```sql
SELECT question_text, 
       ts_rank(to_tsvector('english', question_text), query) as rank
FROM questions, to_tsquery('english', 'iran & history') query
WHERE to_tsvector('english', question_text) @@ query
ORDER BY rank DESC;
```

---

### 4. **Trigram Search (pg_trgm)**

```sql
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE INDEX idx_users_username_trgm ON users 
USING GIN (username gin_trgm_ops);
```

**مزایا:**
- جستجوی fuzzy (تقریبی)
- پیدا کردن نتایج مشابه
- مناسب برای autocomplete

**مثال Query:**
```sql
SELECT username FROM users 
WHERE username % 'ahmad'  -- Similarity search
ORDER BY similarity(username, 'ahmad') DESC;
```

---

### 5. **Array Types**

```sql
tags TEXT[]  -- Array of tags
```

**استفاده در:**
- `questions.tags`: تگ‌های سوال

**مزایا:**
- ذخیره لیست مقادیر
- Query با array operators
- Indexing با GIN

**مثال Query:**
```sql
-- پیدا کردن سوالات با تگ خاص
SELECT * FROM questions 
WHERE 'history' = ANY(tags);

-- Index
CREATE INDEX idx_questions_tags ON questions USING GIN (tags);
```

---

### 6. **Partial Indexes**

```sql
CREATE INDEX idx_users_active ON users(is_active) 
WHERE is_active = true;
```

**مزایا:**
- Index کوچکتر
- Performance بهتر
- فقط برای داده‌های فعال

**استفاده در:**
- `users.is_active = true`
- `questions.is_active = true`
- `matches.status = 'ACTIVE'`

---

### 7. **Materialized Views**

```sql
CREATE MATERIALIZED VIEW user_leaderboard_mv AS
SELECT ...;

-- Refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY user_leaderboard_mv;
```

**مزایا:**
- Cache نتایج query های پیچیده
- Performance بسیار بهتر
- Refresh در زمان مناسب

**استفاده:**
- Leaderboard (به‌روزرسانی دوره‌ای)
- آمار کلی

---

### 8. **GIN Indexes**

```sql
CREATE INDEX idx_questions_metadata_gin ON questions 
USING GIN (metadata);
```

**استفاده برای:**
- JSONB columns
- Array columns
- Full-text search
- Trigram search

**مزایا:**
- Query سریع‌تر
- مناسب برای داده‌های پیچیده

---

### 9. **Functions و Stored Procedures**

```sql
CREATE OR REPLACE FUNCTION get_random_questions(...)
RETURNS TABLE (...) AS $$
BEGIN
    -- Logic
END;
$$ LANGUAGE plpgsql;
```

**Functions ایجاد شده:**
- `get_random_questions()`: دریافت سوالات تصادفی
- `calculate_level()`: محاسبه level از XP
- `get_xp_for_level()`: محاسبه XP مورد نیاز
- `refresh_leaderboard()`: به‌روزرسانی leaderboard

**مزایا:**
- Logic در دیتابیس
- Performance بهتر
- Reusability

---

### 10. **Triggers با WHEN Clause**

```sql
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)  -- فقط اگر تغییر کرده باشد
    EXECUTE FUNCTION update_updated_at_column();
```

**مزایا:**
- اجرا فقط در صورت تغییر واقعی
- Performance بهتر
- جلوگیری از به‌روزرسانی غیرضروری

---

### 11. **Composite Indexes**

```sql
CREATE INDEX idx_questions_category_difficulty 
ON questions(category_id, difficulty) 
WHERE is_active = true;
```

**مزایا:**
- Query های چندستونی
- Performance بهتر
- Partial index ترکیبی

---

### 12. **Descending Indexes**

```sql
CREATE INDEX idx_users_total_score ON users(total_score DESC);
```

**مزایا:**
- مرتب‌سازی نزولی سریع‌تر
- مناسب برای Leaderboard

---

## 📊 مقایسه Performance

### بدون بهینه‌سازی:
```sql
-- Query: دریافت leaderboard
SELECT * FROM users ORDER BY total_score DESC LIMIT 100;
-- زمان: ~500ms
```

### با بهینه‌سازی:
```sql
-- استفاده از Materialized View
SELECT * FROM user_leaderboard_mv LIMIT 100;
-- زمان: ~5ms (100x سریع‌تر!)
```

---

## 🔧 تنظیمات پیشنهادی PostgreSQL

### postgresql.conf

```conf
# Memory
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
maintenance_work_mem = 128MB

# Query Planner
random_page_cost = 1.1  # For SSD
effective_io_concurrency = 200

# Connections
max_connections = 100

# Logging
log_min_duration_statement = 1000  # Log slow queries
```

---

## 📈 Monitoring Queries

### بررسی Index Usage
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### بررسی Slow Queries
```sql
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### بررسی Table Sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🎯 Best Practices

### 1. استفاده از Prepared Statements
```javascript
// در Node.js
const query = 'SELECT * FROM users WHERE id = $1';
await client.query(query, [userId]);
```

### 2. Connection Pooling
```javascript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 3. استفاده از Transactions
```sql
BEGIN;
  INSERT INTO matches ...;
  INSERT INTO match_questions ...;
COMMIT;
```

### 4. Vacuum و Analyze
```sql
-- به صورت دوره‌ای اجرا شود
VACUUM ANALYZE;
```

### 5. Monitoring
- استفاده از `pg_stat_statements`
- بررسی slow queries
- Monitoring index usage

---

## 🔍 Query Optimization Tips

### 1. استفاده از EXPLAIN
```sql
EXPLAIN ANALYZE 
SELECT * FROM questions 
WHERE category_id = 1 AND difficulty = 'MEDIUM';
```

### 2. جلوگیری از N+1 Queries
```sql
-- بد
SELECT * FROM matches;
-- سپس برای هر match:
SELECT * FROM match_questions WHERE match_id = ?;

-- خوب
SELECT m.*, mq.* 
FROM matches m
LEFT JOIN match_questions mq ON mq.match_id = m.id;
```

### 3. استفاده از LIMIT
```sql
-- همیشه LIMIT اضافه کنید
SELECT * FROM users ORDER BY total_score DESC LIMIT 100;
```

---

## 📚 منابع مفید

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [pg_trgm Extension](https://www.postgresql.org/docs/current/pgtrgm.html)
- [JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)

---

این بهینه‌سازی‌ها باعث می‌شود دیتابیس برای Production آماده باشد و Performance بهتری داشته باشد.

