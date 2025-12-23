# طراحی کامل دیتابیس Quiz Game

## 📊 نمودار روابط (ERD)

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Users     │         │  Categories  │         │  Questions  │
├─────────────┤         ├──────────────┤         ├─────────────┤
│ id (PK)     │         │ id (PK)      │         │ id (PK)     │
│ username    │         │ name         │◄────────┤ category_id │
│ email       │         │ description  │         │ difficulty  │
│ password    │         │ icon         │         │ question    │
│ level       │         │ created_at   │         │ explanation │
│ xp          │         └──────────────┘         │ points      │
│ total_score │                                  │ created_at  │
│ avatar_url  │                                  └─────────────┘
│ created_at  │                                         │
│ updated_at  │                                         │
└─────────────┘                                         │
      │                                                  │
      │                                                  │
      │         ┌──────────────┐                        │
      │         │   Matches    │                        │
      │         ├──────────────┤                        │
      │         │ id (PK)      │                        │
      │         │ user_id (FK) │                        │
      │         │ category_id  │                        │
      │         │ difficulty   │                        │
      │         │ started_at   │                        │
      │         │ ended_at     │                        │
      │         │ total_score  │                        │
      │         │ status       │                        │
      │         └──────────────┘                        │
      │                │                                │
      │                │                                │
      │                │         ┌──────────────┐       │
      │                │         │   Answers   │       │
      │                │         ├──────────────┤       │
      │                └─────────┤ match_id (FK)│       │
      │                          │ question_id  │───────┘
      │                          │ user_answer  │
      │                          │ is_correct  │
      │                          │ time_taken  │
      │                          │ points      │
      │                          │ answered_at │
      │                          └──────────────┘
      │
      │         ┌──────────────┐
      │         │ Achievements │
      │         ├──────────────┤
      │         │ id (PK)      │
      │         │ name         │
      │         │ description  │
      │         │ icon         │
      │         │ type         │
      │         │ value        │
      │         └──────────────┘
      │                │
      │                │
      │         ┌──────────────────┐
      │         │ UserAchievements │
      │         ├──────────────────┤
      │         │ user_id (FK)     │
      │         │ achievement_id   │
      │         │ unlocked_at      │
      │         └──────────────────┘
      │
      │         ┌──────────────┐
      │         │ UserStats    │
      │         ├──────────────┤
      │         │ user_id (FK) │
      │         │ category_id  │
      │         │ games_played │
      │         │ correct      │
      │         │ wrong        │
      │         │ best_score   │
      │         └──────────────┘
```

---

## 📋 جداول و فیلدها

### 1. جدول `users` - کاربران

**مسئولیت**: ذخیره اطلاعات کاربران

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    xp INTEGER DEFAULT 0 NOT NULL,
    total_score INTEGER DEFAULT 0 NOT NULL,
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_admin BOOLEAN DEFAULT false NOT NULL,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT check_level_positive CHECK (level >= 1),
    CONSTRAINT check_xp_non_negative CHECK (xp >= 0),
    CONSTRAINT check_score_non_negative CHECK (total_score >= 0)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_level ON users(level);
CREATE INDEX idx_users_xp ON users(xp);
CREATE INDEX idx_users_total_score ON users(total_score);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**فیلدها:**
- `id`: شناسه یکتا (Primary Key)
- `username`: نام کاربری (Unique)
- `email`: ایمیل (Unique)
- `password_hash`: رمز عبور hash شده
- `level`: سطح کاربر (شروع از 1)
- `xp`: امتیاز تجربه
- `total_score`: مجموع امتیازهای کسب شده
- `avatar_url`: آدرس تصویر پروفایل
- `is_active`: وضعیت فعال/غیرفعال
- `is_admin`: دسترسی ادمین
- `last_login_at`: آخرین زمان ورود
- `created_at`: زمان ایجاد
- `updated_at`: زمان آخرین به‌روزرسانی

---

### 2. جدول `categories` - دسته‌بندی‌ها

**مسئولیت**: دسته‌بندی سوالات

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color code
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
```

**فیلدها:**
- `id`: شناسه یکتا
- `name`: نام دسته (Unique)
- `description`: توضیحات
- `icon`: نام آیکون
- `color`: رنگ دسته (Hex)
- `is_active`: فعال/غیرفعال
- `sort_order`: ترتیب نمایش
- `created_at`: زمان ایجاد
- `updated_at`: زمان به‌روزرسانی

---

### 3. جدول `questions` - سوالات

**مسئولیت**: ذخیره سوالات و گزینه‌های آنها

```sql
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'EXPERT')),
    question_text TEXT NOT NULL,
    explanation TEXT,
    points INTEGER DEFAULT 10 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT check_points_positive CHECK (points > 0)
);

-- Indexes
CREATE INDEX idx_questions_category ON questions(category_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_active ON questions(is_active);
CREATE INDEX idx_questions_category_difficulty ON questions(category_id, difficulty);
CREATE INDEX idx_questions_created_at ON questions(created_at);
```

**فیلدها:**
- `id`: شناسه یکتا
- `category_id`: شناسه دسته (Foreign Key)
- `difficulty`: سطح دشواری (EASY, MEDIUM, HARD, EXPERT)
- `question_text`: متن سوال
- `explanation`: توضیح پاسخ صحیح
- `points`: امتیاز پایه سوال
- `is_active`: فعال/غیرفعال
- `created_by`: کاربر ایجادکننده
- `created_at`: زمان ایجاد
- `updated_at`: زمان به‌روزرسانی

---

### 4. جدول `question_options` - گزینه‌های سوالات

**مسئولیت**: ذخیره گزینه‌های هر سوال (4 گزینه)

```sql
CREATE TABLE question_options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text VARCHAR(255) NOT NULL,
    is_correct BOOLEAN DEFAULT false NOT NULL,
    option_order INTEGER NOT NULL CHECK (option_order BETWEEN 1 AND 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT unique_question_option_order UNIQUE (question_id, option_order),
    CONSTRAINT check_single_correct_answer CHECK (
        (SELECT COUNT(*) FROM question_options 
         WHERE question_id = question_options.question_id 
         AND is_correct = true) = 1
    )
);

-- Indexes
CREATE INDEX idx_question_options_question ON question_options(question_id);
CREATE INDEX idx_question_options_correct ON question_options(question_id, is_correct);
```

**فیلدها:**
- `id`: شناسه یکتا
- `question_id`: شناسه سوال (Foreign Key)
- `option_text`: متن گزینه
- `is_correct`: آیا پاسخ صحیح است
- `option_order`: ترتیب گزینه (1-4)
- `created_at`: زمان ایجاد

**Constraints:**
- هر سوال باید دقیقاً 4 گزینه داشته باشد
- هر سوال باید دقیقاً 1 پاسخ صحیح داشته باشد

---

### 5. جدول `matches` - بازی‌ها (Sessions)

**مسئولیت**: ذخیره اطلاعات هر بازی/سشن

```sql
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    difficulty VARCHAR(20) CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'EXPERT', 'MIXED')),
    questions_count INTEGER DEFAULT 10 NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    total_score INTEGER DEFAULT 0 NOT NULL,
    correct_answers INTEGER DEFAULT 0 NOT NULL,
    wrong_answers INTEGER DEFAULT 0 NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'ABANDONED', 'TIMED_OUT')),
    time_spent INTEGER, -- Total time in seconds
    is_practice BOOLEAN DEFAULT false NOT NULL, -- Practice mode: no timer, no scoring, just learning
    game_mode VARCHAR(20) DEFAULT 'SINGLE_PLAYER' CHECK (game_mode IN ('SINGLE_PLAYER', 'MULTI_PLAYER', 'PRACTICE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT check_questions_count_positive CHECK (questions_count > 0),
    CONSTRAINT check_score_non_negative CHECK (total_score >= 0),
    CONSTRAINT check_correct_non_negative CHECK (correct_answers >= 0),
    CONSTRAINT check_wrong_non_negative CHECK (wrong_answers >= 0),
    CONSTRAINT check_answers_sum CHECK (correct_answers + wrong_answers <= questions_count)
);

-- Indexes
CREATE INDEX idx_matches_user ON matches(user_id);
CREATE INDEX idx_matches_category ON matches(category_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_started_at ON matches(started_at);
CREATE INDEX idx_matches_user_status ON matches(user_id, status);
CREATE INDEX idx_matches_user_created ON matches(user_id, created_at DESC);
```

**فیلدها:**
- `id`: شناسه یکتا
- `user_id`: شناسه کاربر (Foreign Key)
- `category_id`: شناسه دسته (اختیاری)
- `difficulty`: سطح دشواری
- `questions_count`: تعداد سوالات
- `started_at`: زمان شروع
- `ended_at`: زمان پایان
- `total_score`: مجموع امتیاز
- `correct_answers`: تعداد پاسخ صحیح
- `wrong_answers`: تعداد پاسخ اشتباه
- `status`: وضعیت بازی (ACTIVE, COMPLETED, ABANDONED, TIMED_OUT)
- `time_spent`: کل زمان صرف شده (ثانیه)
- `is_practice`: حالت تمرین (بدون تایمر، بدون امتیازدهی)
- `game_mode`: نوع بازی (SINGLE_PLAYER, MULTI_PLAYER, PRACTICE)
- `created_at`: زمان ایجاد

---

### 6. جدول `match_questions` - سوالات هر بازی

**مسئولیت**: ذخیره سوالات انتخاب شده برای هر بازی

```sql
CREATE TABLE match_questions (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    question_order INTEGER NOT NULL CHECK (question_order >= 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT unique_match_question_order UNIQUE (match_id, question_order)
);

-- Indexes
CREATE INDEX idx_match_questions_match ON match_questions(match_id);
CREATE INDEX idx_match_questions_question ON match_questions(question_id);
CREATE INDEX idx_match_questions_order ON match_questions(match_id, question_order);
```

**فیلدها:**
- `id`: شناسه یکتا
- `match_id`: شناسه بازی (Foreign Key)
- `question_id`: شناسه سوال (Foreign Key)
- `question_order`: ترتیب سوال در بازی
- `created_at`: زمان ایجاد

**هدف**: ذخیره ترتیب سوالات برای هر بازی

---

### 7. جدول `user_answers` - پاسخ‌های کاربران

**مسئولیت**: ذخیره پاسخ‌های کاربران به هر سوال

```sql
CREATE TABLE user_answers (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    selected_option_id INTEGER REFERENCES question_options(id) ON DELETE SET NULL,
    user_answer_text VARCHAR(255), -- For backup if option deleted
    is_correct BOOLEAN NOT NULL,
    time_taken INTEGER NOT NULL CHECK (time_taken >= 0), -- Time in seconds
    points_earned INTEGER DEFAULT 0 NOT NULL,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT unique_match_question_answer UNIQUE (match_id, question_id),
    CONSTRAINT check_points_non_negative CHECK (points_earned >= 0)
);

-- Indexes
CREATE INDEX idx_user_answers_match ON user_answers(match_id);
CREATE INDEX idx_user_answers_question ON user_answers(question_id);
CREATE INDEX idx_user_answers_correct ON user_answers(is_correct);
CREATE INDEX idx_user_answers_match_question ON user_answers(match_id, question_id);
```

**فیلدها:**
- `id`: شناسه یکتا
- `match_id`: شناسه بازی (Foreign Key)
- `question_id`: شناسه سوال (Foreign Key)
- `selected_option_id`: شناسه گزینه انتخاب شده
- `user_answer_text`: متن پاسخ (backup)
- `is_correct`: آیا پاسخ صحیح است
- `time_taken`: زمان پاسخ (ثانیه)
- `points_earned`: امتیاز کسب شده
- `answered_at`: زمان پاسخ

---

### 8. جدول `achievements` - دستاوردها

**مسئولیت**: تعریف دستاوردهای بازی

```sql
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50),
    achievement_type VARCHAR(50) NOT NULL CHECK (achievement_type IN (
        'LEVEL', 'SCORE', 'GAMES', 'CORRECT_ANSWERS', 
        'STREAK', 'CATEGORY', 'SPECIAL'
    )),
    requirement_value INTEGER NOT NULL,
    xp_reward INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT check_requirement_positive CHECK (requirement_value > 0),
    CONSTRAINT check_xp_reward_non_negative CHECK (xp_reward >= 0)
);

-- Indexes
CREATE INDEX idx_achievements_type ON achievements(achievement_type);
CREATE INDEX idx_achievements_active ON achievements(is_active);
```

**فیلدها:**
- `id`: شناسه یکتا
- `name`: نام دستاورد (Unique)
- `description`: توضیحات
- `icon`: نام آیکون
- `achievement_type`: نوع دستاورد
- `requirement_value`: مقدار مورد نیاز
- `xp_reward`: پاداش XP
- `is_active`: فعال/غیرفعال
- `created_at`: زمان ایجاد

**انواع دستاوردها:**
- `LEVEL`: رسیدن به سطح خاص
- `SCORE`: کسب امتیاز خاص
- `GAMES`: تعداد بازی انجام شده
- `CORRECT_ANSWERS`: تعداد پاسخ صحیح
- `STREAK`: رکورد پاسخ صحیح متوالی
- `CATEGORY`: تسلط بر دسته خاص
- `SPECIAL`: دستاوردهای ویژه

---

### 9. جدول `user_achievements` - دستاوردهای کاربران

**مسئولیت**: ذخیره دستاوردهای باز شده توسط کاربران

```sql
CREATE TABLE user_achievements (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    PRIMARY KEY (user_id, achievement_id)
);

-- Indexes
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(unlocked_at DESC);
```

**فیلدها:**
- `user_id`: شناسه کاربر (Foreign Key)
- `achievement_id`: شناسه دستاورد (Foreign Key)
- `unlocked_at`: زمان باز شدن

---

### 10. جدول `user_stats` - آمار کاربران

**مسئولیت**: ذخیره آمار تفصیلی کاربران بر اساس دسته

```sql
CREATE TABLE user_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    games_played INTEGER DEFAULT 0 NOT NULL,
    total_questions INTEGER DEFAULT 0 NOT NULL,
    correct_answers INTEGER DEFAULT 0 NOT NULL,
    wrong_answers INTEGER DEFAULT 0 NOT NULL,
    best_score INTEGER DEFAULT 0 NOT NULL,
    average_score DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    average_time DECIMAL(10, 2) DEFAULT 0 NOT NULL, -- Average time per question
    accuracy_rate DECIMAL(5, 2) DEFAULT 0 NOT NULL, -- Percentage
    last_played_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT unique_user_category_stats UNIQUE (user_id, category_id),
    CONSTRAINT check_games_non_negative CHECK (games_played >= 0),
    CONSTRAINT check_correct_non_negative CHECK (correct_answers >= 0),
    CONSTRAINT check_wrong_non_negative CHECK (wrong_answers >= 0),
    CONSTRAINT check_best_score_non_negative CHECK (best_score >= 0),
    CONSTRAINT check_accuracy_range CHECK (accuracy_rate >= 0 AND accuracy_rate <= 100)
);

-- Indexes
CREATE INDEX idx_user_stats_user ON user_stats(user_id);
CREATE INDEX idx_user_stats_category ON user_stats(category_id);
CREATE INDEX idx_user_stats_best_score ON user_stats(user_id, best_score DESC);
CREATE INDEX idx_user_stats_accuracy ON user_stats(user_id, accuracy_rate DESC);
```

**فیلدها:**
- `id`: شناسه یکتا
- `user_id`: شناسه کاربر (Foreign Key)
- `category_id`: شناسه دسته (NULL = آمار کلی)
- `games_played`: تعداد بازی انجام شده
- `total_questions`: تعداد کل سوالات پاسخ داده شده
- `correct_answers`: تعداد پاسخ صحیح
- `wrong_answers`: تعداد پاسخ اشتباه
- `best_score`: بهترین امتیاز
- `average_score`: میانگین امتیاز
- `average_time`: میانگین زمان پاسخ
- `accuracy_rate`: درصد دقت (0-100)
- `last_played_at`: آخرین زمان بازی
- `created_at`: زمان ایجاد
- `updated_at`: زمان به‌روزرسانی

**نکته**: `category_id = NULL` برای آمار کلی کاربر

---

### 11. جدول `leaderboard` - جدول رده‌بندی (Cache)

**مسئولیت**: Cache برای جدول رده‌بندی (اختیاری - می‌توان از Redis استفاده کرد)

```sql
CREATE TABLE leaderboard (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rank_position INTEGER NOT NULL,
    total_score INTEGER NOT NULL,
    level INTEGER NOT NULL,
    xp INTEGER NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('ALL_TIME', 'WEEKLY', 'MONTHLY')),
    period_start DATE NOT NULL,
    period_end DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT unique_user_period_rank UNIQUE (user_id, period_type, period_start)
);

-- Indexes
CREATE INDEX idx_leaderboard_period ON leaderboard(period_type, period_start);
CREATE INDEX idx_leaderboard_rank ON leaderboard(period_type, period_start, rank_position);
CREATE INDEX idx_leaderboard_user ON leaderboard(user_id);
```

**فیلدها:**
- `id`: شناسه یکتا
- `user_id`: شناسه کاربر
- `rank_position`: رتبه
- `total_score`: مجموع امتیاز
- `level`: سطح
- `xp`: امتیاز تجربه
- `period_type`: نوع دوره (ALL_TIME, WEEKLY, MONTHLY)
- `period_start`: شروع دوره
- `period_end`: پایان دوره
- `updated_at`: زمان به‌روزرسانی

---

## 🔗 روابط بین جداول

### Foreign Keys

1. **questions** → **categories** (category_id)
2. **questions** → **users** (created_by)
3. **question_options** → **questions** (question_id)
4. **matches** → **users** (user_id)
5. **matches** → **categories** (category_id)
6. **match_questions** → **matches** (match_id)
7. **match_questions** → **questions** (question_id)
8. **user_answers** → **matches** (match_id)
9. **user_answers** → **questions** (question_id)
10. **user_answers** → **question_options** (selected_option_id)
11. **user_achievements** → **users** (user_id)
12. **user_achievements** → **achievements** (achievement_id)
13. **user_stats** → **users** (user_id)
14. **user_stats** → **categories** (category_id)
15. **leaderboard** → **users** (user_id)

### Cascade Rules

- **ON DELETE CASCADE**: 
  - حذف کاربر → حذف بازی‌ها، پاسخ‌ها، آمار
  - حذف بازی → حذف سوالات و پاسخ‌های آن
  - حذف سوال → حذف گزینه‌های آن

- **ON DELETE RESTRICT**:
  - نمی‌توان دسته‌ای را حذف کرد که سوال دارد
  - نمی‌توان سوالی را حذف کرد که در بازی استفاده شده

- **ON DELETE SET NULL**:
  - حذف کاربر → created_by در questions = NULL
  - حذف دسته → category_id در matches = NULL

---

## 📊 Indexes برای بهینه‌سازی

### Primary Indexes
- تمام جداول دارای Primary Key (id)

### Foreign Key Indexes
- تمام Foreign Keys دارای index

### Query Optimization Indexes
- `users`: email, username, level, xp, total_score
- `questions`: category_id, difficulty, is_active
- `matches`: user_id, status, started_at
- `user_answers`: match_id, question_id, is_correct
- `user_stats`: user_id, category_id, best_score

### Composite Indexes
- `questions(category_id, difficulty)`: برای فیلتر سوالات
- `matches(user_id, status)`: برای بازی‌های فعال کاربر
- `user_stats(user_id, best_score DESC)`: برای رتبه‌بندی

---

## 🔒 Constraints و Validations

### Check Constraints
- `users`: level >= 1, xp >= 0, total_score >= 0
- `questions`: difficulty IN ('EASY', 'MEDIUM', 'HARD', 'EXPERT')
- `question_options`: option_order BETWEEN 1 AND 4
- `matches`: status IN ('ACTIVE', 'COMPLETED', 'ABANDONED', 'TIMED_OUT')
- `user_answers`: time_taken >= 0, points_earned >= 0
- `user_stats`: accuracy_rate BETWEEN 0 AND 100

### Unique Constraints
- `users`: username, email
- `categories`: name
- `achievements`: name
- `question_options`: (question_id, option_order)
- `match_questions`: (match_id, question_order)
- `user_answers`: (match_id, question_id)
- `user_stats`: (user_id, category_id)
- `user_achievements`: (user_id, achievement_id)

---

## 📈 Views پیشنهادی

### View: `user_leaderboard_view`
```sql
CREATE VIEW user_leaderboard_view AS
SELECT 
    u.id,
    u.username,
    u.level,
    u.xp,
    u.total_score,
    ROW_NUMBER() OVER (ORDER BY u.total_score DESC, u.xp DESC) as rank
FROM users u
WHERE u.is_active = true
ORDER BY u.total_score DESC, u.xp DESC;
```

### View: `category_statistics_view`
```sql
CREATE VIEW category_statistics_view AS
SELECT 
    c.id,
    c.name,
    COUNT(DISTINCT q.id) as total_questions,
    COUNT(DISTINCT m.id) as total_matches,
    AVG(m.total_score) as average_score
FROM categories c
LEFT JOIN questions q ON q.category_id = c.id
LEFT JOIN matches m ON m.category_id = c.id
WHERE c.is_active = true
GROUP BY c.id, c.name;
```

---

## 🔄 Triggers پیشنهادی

### Trigger: Update `updated_at` automatically
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... برای سایر جداول
```

### Trigger: Update user stats after answer
```sql
CREATE OR REPLACE FUNCTION update_user_stats_after_answer()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user_stats when answer is submitted
    -- Logic here
    RETURN NEW;
END;
$$ language 'plpgsql';
```

---

## 📝 Notes

1. **Normalization**: دیتابیس در 3NF (Third Normal Form) است
2. **Performance**: Indexes برای query های پرکاربرد اضافه شده
3. **Data Integrity**: Foreign Keys و Constraints برای حفظ یکپارچگی
4. **Scalability**: ساختار آماده برای مقیاس‌پذیری
5. **Audit**: created_at و updated_at برای tracking تغییرات

---

این طراحی دیتابیس برای یک سیستم Production-ready مناسب است و تمام نیازهای بازی Quiz را پوشش می‌دهد.

