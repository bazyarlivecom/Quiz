# طراحی فنی و معماری سیستم Quiz Game

## 1. معماری کلی سیستم

### 1.1 معماری سه‌لایه (Three-Tier Architecture)

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│    (Frontend - React/Vue/Angular)   │
└─────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────┐
│        Application Layer            │
│    (Backend API - Node.js/Python)   │
└─────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────┐
│          Data Layer                 │
│    (Database - PostgreSQL/MongoDB)   │
└─────────────────────────────────────┘
```

### 1.2 معماری میکروسرویس (اختیاری برای مقیاس‌پذیری)

برای شروع می‌توان با معماری Monolithic شروع کرد و در صورت نیاز به میکروسرویس تبدیل کرد:

- **User Service**: مدیریت کاربران، احراز هویت، پروفایل
- **Quiz Service**: مدیریت سوالات، دسته‌بندی‌ها، بازی
- **Score Service**: مدیریت امتیازها، رنکینگ، لِوِل
- **Notification Service**: اعلان‌ها و رویدادها

### 1.3 جریان کلی سیستم

```
User Registration/Login
    ↓
Select Category & Difficulty
    ↓
Start Quiz Session
    ↓
Question Display (with Timer)
    ↓
User Answer Submission
    ↓
Score Calculation
    ↓
Progress Update (Level, XP, Achievements)
    ↓
Next Question / End Quiz
```

---

## 2. تکنولوژی‌های پیشنهادی

### 2.1 Frontend

**گزینه 1: React (پیشنهادی)**
- **React 18+** با TypeScript
- **Next.js 14+** (برای SSR و SEO بهتر)
- **State Management**: Zustand یا Redux Toolkit
- **UI Framework**: 
  - Tailwind CSS (برای استایل‌دهی سریع)
  - Shadcn/ui یا Material-UI (کامپوننت‌های آماده)
- **Animation**: Framer Motion
- **HTTP Client**: Axios یا Fetch API
- **Real-time**: Socket.io-client (برای بازی چندنفره در آینده)

**گزینه 2: Vue.js**
- Vue 3 با Composition API
- Nuxt.js
- Pinia برای state management
- Vuetify یا Quasar

**گزینه 3: Angular**
- Angular 17+
- RxJS برای reactive programming
- Angular Material

### 2.2 Backend

**گزینه 1: Node.js (پیشنهادی)**
- **Runtime**: Node.js 20+ LTS
- **Framework**: 
  - Express.js (ساده و سریع)
  - NestJS (برای پروژه‌های بزرگ‌تر با معماری بهتر)
- **Language**: TypeScript
- **Authentication**: JWT + Passport.js
- **Validation**: Joi یا Zod
- **API Documentation**: Swagger/OpenAPI

**گزینه 2: Python**
- FastAPI یا Django REST Framework
- SQLAlchemy یا Django ORM
- Pydantic برای validation

**گزینه 3: Go**
- Gin یا Echo framework
- GORM برای ORM

### 2.3 Database

**گزینه 1: PostgreSQL (پیشنهادی)**
- پایگاه داده رابطه‌ای قدرتمند
- پشتیبانی از JSON برای داده‌های انعطاف‌پذیر
- Full-text search برای جستجوی سوالات
- مناسب برای داده‌های ساختاریافته

**گزینه 2: MongoDB**
- NoSQL برای انعطاف بیشتر
- مناسب برای سوالات با ساختار متغیر
- Schema-less design

**گزینه 3: ترکیبی (PostgreSQL + Redis)**
- PostgreSQL برای داده‌های اصلی
- Redis برای:
  - Cache سوالات
  - Session management
  - Leaderboard (Sorted Sets)
  - Rate limiting

### 2.4 سایر تکنولوژی‌ها

- **Containerization**: Docker
- **CI/CD**: GitHub Actions یا GitLab CI
- **Cloud**: AWS, Azure, یا DigitalOcean
- **CDN**: Cloudflare (برای استاتیک)
- **Monitoring**: Sentry (برای error tracking)
- **Analytics**: Google Analytics یا Mixpanel

---

## 3. ماژول‌های اصلی سیستم

### 3.1 ماژول احراز هویت و کاربر (Authentication & User)

**مسئولیت‌ها:**
- ثبت‌نام کاربر
- ورود/خروج
- مدیریت پروفایل کاربر
- بازیابی رمز عبور
- مدیریت session

**Entity:**
- User (id, username, email, password_hash, level, xp, total_score, created_at, updated_at)

**API Endpoints:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/users/profile`
- `POST /api/auth/forgot-password`

### 3.2 ماژول مدیریت سوالات (Question Management)

**مسئولیت‌ها:**
- CRUD سوالات
- دسته‌بندی سوالات
- مدیریت سطح دشواری
- جستجو و فیلتر سوالات
- تصادفی‌سازی سوالات

**Entities:**
- Category (id, name, description, icon, created_at)
- Question (id, category_id, difficulty, question_text, correct_answer, wrong_answers[], explanation, points, created_at)
- Difficulty (EASY, MEDIUM, HARD, EXPERT)

**API Endpoints:**
- `GET /api/questions` (با فیلتر category, difficulty)
- `GET /api/questions/:id`
- `POST /api/questions` (admin)
- `PUT /api/questions/:id` (admin)
- `DELETE /api/questions/:id` (admin)
- `GET /api/categories`
- `GET /api/questions/random` (برای بازی)

### 3.3 ماژول بازی (Game/Quiz Session)

**مسئولیت‌ها:**
- شروع یک بازی جدید
- مدیریت session بازی
- نمایش سوالات
- دریافت پاسخ کاربر
- محاسبه امتیاز
- مدیریت تایمر

**Entities:**
- QuizSession (id, user_id, category_id, difficulty, started_at, ended_at, total_score, status)
- QuizAnswer (id, session_id, question_id, user_answer, is_correct, time_taken, points_earned, answered_at)

**API Endpoints:**
- `POST /api/quiz/start` (ایجاد session جدید)
- `GET /api/quiz/session/:id`
- `POST /api/quiz/answer` (ارسال پاسخ)
- `GET /api/quiz/session/:id/next-question`
- `POST /api/quiz/session/:id/end`
- `GET /api/quiz/session/:id/results`

**Logic:**
- محاسبه امتیاز بر اساس:
  - صحیح بودن پاسخ
  - زمان پاسخ (هرچه سریع‌تر، امتیاز بیشتر)
  - سطح دشواری سوال
- فرمول پیشنهادی: `base_points * difficulty_multiplier * time_bonus`

### 3.4 ماژول امتیازدهی و پیشرفت (Scoring & Progress)

**مسئولیت‌ها:**
- محاسبه امتیاز هر پاسخ
- به‌روزرسانی XP کاربر
- مدیریت لِوِل کاربر
- محاسبه رنکینگ
- مدیریت دستاوردها (Achievements)

**Entities:**
- UserProgress (user_id, level, xp, total_games, total_correct, total_wrong, best_score, category_stats)
- Achievement (id, name, description, icon, requirement)
- UserAchievement (user_id, achievement_id, unlocked_at)

**Logic:**
- سیستم لِوِل: XP-based
  - Level 1: 0-100 XP
  - Level 2: 101-300 XP
  - Level 3: 301-600 XP
  - فرمول: `level = floor(sqrt(xp / 100)) + 1`
- XP کسب شده:
  - پاسخ صحیح: 10-50 XP (بسته به difficulty)
  - پاسخ سریع (زیر 5 ثانیه): +20% bonus
  - پاسخ اشتباه: 0 XP

**API Endpoints:**
- `GET /api/users/:id/progress`
- `GET /api/users/:id/achievements`
- `GET /api/leaderboard` (global, weekly, monthly)
- `GET /api/leaderboard/category/:categoryId`

### 3.5 ماژول تایمر (Timer)

**مسئولیت‌ها:**
- مدیریت تایمر برای هر سوال
- اعلان زمان تمام شده
- محاسبه زمان باقیمانده

**Implementation:**
- Frontend: استفاده از `setInterval` یا `requestAnimationFrame`
- Backend: Validation زمان پاسخ (prevent cheating)
- پیشنهاد: 30 ثانیه برای هر سوال

### 3.6 ماژول دسته‌بندی (Categories)

**مسئولیت‌ها:**
- مدیریت دسته‌بندی‌های سوالات
- نمایش آمار هر دسته
- فیلتر بر اساس دسته

**Categories پیشنهادی:**
- تاریخ
- جغرافیا
- علوم
- ورزش
- هنر و ادبیات
- تکنولوژی
- عمومی

### 3.7 ماژول آمار و گزارش (Statistics & Analytics)

**مسئولیت‌ها:**
- نمایش آمار کاربر
- آمار کلی سیستم
- گزارش عملکرد

**API Endpoints:**
- `GET /api/users/:id/stats`
- `GET /api/stats/global`

**Statistics:**
- تعداد بازی‌های انجام شده
- درصد پاسخ صحیح
- بهترین امتیاز
- آمار بر اساس دسته
- روند پیشرفت در زمان

---

## 4. ساختار پایگاه داده (Database Schema)

### 4.1 جداول اصلی

```sql
-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions Table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'EXPERT')),
    question_text TEXT NOT NULL,
    correct_answer VARCHAR(255) NOT NULL,
    wrong_answers JSONB NOT NULL, -- Array of 3 wrong answers
    explanation TEXT,
    points INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz Sessions Table
CREATE TABLE quiz_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    category_id INTEGER REFERENCES categories(id),
    difficulty VARCHAR(20),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    total_score INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ABANDONED')),
    questions_count INTEGER DEFAULT 10
);

-- Quiz Answers Table
CREATE TABLE quiz_answers (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES quiz_sessions(id),
    question_id INTEGER REFERENCES questions(id),
    user_answer VARCHAR(255),
    is_correct BOOLEAN,
    time_taken INTEGER, -- in seconds
    points_earned INTEGER DEFAULT 0,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Achievements Table
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    requirement_type VARCHAR(50), -- 'LEVEL', 'SCORE', 'GAMES', etc.
    requirement_value INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Achievements Table
CREATE TABLE user_achievements (
    user_id INTEGER REFERENCES users(id),
    achievement_id INTEGER REFERENCES achievements(id),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id)
);
```

### 4.2 Indexes برای بهینه‌سازی

```sql
CREATE INDEX idx_questions_category ON questions(category_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_quiz_sessions_user ON quiz_sessions(user_id);
CREATE INDEX idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX idx_users_level ON users(level);
CREATE INDEX idx_users_xp ON users(xp);
```

---

## 5. ساختار API (RESTful API Design)

### 5.1 Base URL
```
https://api.quizgame.com/v1
```

### 5.2 Authentication
- استفاده از JWT Token
- Header: `Authorization: Bearer <token>`

### 5.3 Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "errors": []
}
```

### 5.4 Error Handling
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

---

## 6. ساختار پروژه پیشنهادی

```
quiz-game/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── quiz/
│   │   │   ├── user/
│   │   │   └── layout/
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Quiz.tsx
│   │   │   ├── Results.tsx
│   │   │   └── Profile.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── auth.ts
│   │   ├── store/
│   │   │   ├── userStore.ts
│   │   │   └── quizStore.ts
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── types/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── questionController.ts
│   │   │   ├── quizController.ts
│   │   │   └── userController.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Question.ts
│   │   │   ├── QuizSession.ts
│   │   │   └── Category.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── questionRoutes.ts
│   │   │   ├── quizRoutes.ts
│   │   │   └── userRoutes.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── quizService.ts
│   │   │   └── scoringService.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   └── errorHandler.ts
│   │   ├── utils/
│   │   │   ├── database.ts
│   │   │   └── helpers.ts
│   │   └── app.ts
│   ├── tests/
│   └── package.json
│
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
│
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.yml
│
└── docs/
    ├── API.md
    └── ARCHITECTURE.md
```

---

## 7. ویژگی‌های پیشرفته (برای آینده)

1. **بازی چندنفره (Multiplayer)**
   - Real-time با WebSocket
   - Turn-based یا Live competition

2. **Daily Challenges**
   - چالش‌های روزانه
   - Rewards ویژه

3. **Tournaments**
   - مسابقات هفتگی/ماهانه
   - Leaderboard جداگانه

4. **Social Features**
   - دوستان
   - چالش دوستانه
   - اشتراک‌گذاری نتایج

5. **Power-ups**
   - 50/50 (حذف 2 گزینه)
   - Time Freeze
   - Hint

6. **Mobile App**
   - React Native یا Flutter

---

## 8. ملاحظات امنیتی

1. **Authentication & Authorization**
   - Hash کردن رمز عبور (bcrypt)
   - JWT با expiration
   - Refresh tokens

2. **Data Validation**
   - Input validation در frontend و backend
   - SQL injection prevention (استفاده از ORM/Parameterized queries)

3. **Rate Limiting**
   - محدود کردن درخواست‌های API
   - جلوگیری از spam

4. **CORS**
   - تنظیم صحیح CORS headers

5. **Cheating Prevention**
   - Validation زمان پاسخ در backend
   - بررسی consistency پاسخ‌ها
   - Server-side timer validation

---

## 9. مراحل توسعه (Development Phases)

### Phase 1: MVP (Minimum Viable Product)
- احراز هویت کاربر
- نمایش سوالات
- سیستم پاسخ‌دهی
- محاسبه امتیاز ساده
- UI پایه

### Phase 2: Core Features
- سیستم لِوِل و XP
- دسته‌بندی سوالات
- تایمر
- Leaderboard
- پروفایل کاربر

### Phase 3: Enhancements
- دستاوردها
- آمار و گزارش
- بهبود UI/UX
- بهینه‌سازی عملکرد

### Phase 4: Advanced Features
- بازی چندنفره
- Daily challenges
- Tournaments
- Mobile app

---

## 10. معیارهای موفقیت (Success Metrics)

- تعداد کاربران فعال
- میانگین زمان بازی
- نرخ بازگشت کاربران
- تعداد بازی‌های انجام شده
- رضایت کاربران (Rating)

---

این سند طراحی فنی به عنوان راهنمای توسعه پروژه استفاده می‌شود و می‌تواند در طول توسعه به‌روزرسانی شود.

