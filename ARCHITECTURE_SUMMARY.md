# خلاصه معماری سیستم Quiz Game

## 🏗️ معماری کلی

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Frontend)                     │
│  React/Next.js + TypeScript + Tailwind CSS                   │
│  - UI Components                                             │
│  - State Management (Zustand/Redux)                         │
│  - API Client (Axios)                                        │
│  - Timer Logic                                               │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP/REST API
                           │ (JWT Authentication)
┌──────────────────────────▼───────────────────────────────────┐
│                    SERVER (Backend)                          │
│  Node.js/Express + TypeScript                                │
│  - REST API Endpoints                                        │
│  - Business Logic                                            │
│  - Authentication & Authorization                            │
│  - Score Calculation                                         │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                    DATABASE                                  │
│  PostgreSQL (Primary)                                        │
│  - Users, Questions, Sessions, Answers                       │
│                                                               │
│  Redis (Cache & Session)                                     │
│  - Question Cache                                            │
│  - Leaderboard                                               │
│  - Session Storage                                           │
└───────────────────────────────────────────────────────────────┘
```

## 📦 ماژول‌های اصلی

### 1. **Authentication Module**
```
User Registration → Login → JWT Token → Protected Routes
```

### 2. **Question Module**
```
Categories → Questions (by difficulty) → Random Selection
```

### 3. **Quiz Session Module**
```
Start Quiz → Load Questions → Display Question → 
User Answer → Calculate Score → Next Question → End Quiz
```

### 4. **Scoring Module**
```
Answer Correct? → Time Bonus → Difficulty Multiplier → 
Update XP → Check Level Up → Update Leaderboard
```

## 🔄 جریان بازی (Game Flow)

```
1. User Login
   ↓
2. Select Category & Difficulty
   ↓
3. Start Quiz Session
   ↓
4. For each question:
   ├─ Display Question (30s timer)
   ├─ User selects answer
   ├─ Calculate points (correct + time + difficulty)
   ├─ Update XP
   └─ Next question
   ↓
5. End Quiz
   ├─ Calculate total score
   ├─ Update user progress
   ├─ Check achievements
   └─ Show results
```

## 🛠️ تکنولوژی‌های پیشنهادی

| لایه | تکنولوژی | دلیل انتخاب |
|------|----------|-------------|
| **Frontend** | React + Next.js + TypeScript | اکوسیستم بزرگ، SSR، Type Safety |
| **Styling** | Tailwind CSS | توسعه سریع، Customizable |
| **State** | Zustand | ساده و سبک |
| **Backend** | Node.js + Express + TypeScript | همزمانی با Frontend، سریع |
| **Database** | PostgreSQL | قدرتمند، ACID compliance |
| **Cache** | Redis | Performance، Leaderboard |
| **Auth** | JWT | Stateless، Scalable |

## 📊 ساختار داده‌های کلیدی

### User Object
```typescript
{
  id: number;
  username: string;
  email: string;
  level: number;
  xp: number;
  totalScore: number;
}
```

### Question Object
```typescript
{
  id: number;
  categoryId: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  questionText: string;
  correctAnswer: string;
  wrongAnswers: string[]; // 3 items
  explanation: string;
  points: number;
}
```

### Quiz Session Object
```typescript
{
  id: number;
  userId: number;
  categoryId: number;
  difficulty: string;
  questions: Question[];
  currentQuestionIndex: number;
  score: number;
  startTime: Date;
  status: 'ACTIVE' | 'COMPLETED';
}
```

## 🎯 فرمول محاسبه امتیاز

```
Base Points = Question.points (10, 20, 30, 50)

Difficulty Multiplier:
- EASY: 1.0x
- MEDIUM: 1.5x
- HARD: 2.0x
- EXPERT: 3.0x

Time Bonus:
- 0-5 seconds: 1.5x
- 6-10 seconds: 1.3x
- 11-20 seconds: 1.1x
- 21-30 seconds: 1.0x

Final Points = Base Points × Difficulty Multiplier × Time Bonus
```

## 📈 سیستم لِوِل

```
XP Required Formula: level² × 100

Level 1: 0-100 XP
Level 2: 101-400 XP
Level 3: 401-900 XP
Level 4: 901-1600 XP
...

XP per Correct Answer:
- EASY: 10 XP
- MEDIUM: 20 XP
- HARD: 30 XP
- EXPERT: 50 XP

Time Bonus: +20% if answered in < 5 seconds
```

## 🔐 امنیت

1. **Authentication**: JWT با expiration (15 min) + Refresh Token
2. **Password**: bcrypt hashing (salt rounds: 10)
3. **Validation**: Input validation در Frontend و Backend
4. **Rate Limiting**: 100 requests/minute per IP
5. **SQL Injection**: استفاده از Parameterized Queries
6. **XSS**: Sanitize user inputs
7. **CORS**: Whitelist specific origins

## 📱 API Endpoints کلیدی

### Authentication
- `POST /api/auth/register` - ثبت‌نام
- `POST /api/auth/login` - ورود
- `POST /api/auth/refresh` - تمدید توکن

### Questions
- `GET /api/questions?category=1&difficulty=MEDIUM` - دریافت سوالات
- `GET /api/questions/random?count=10` - سوالات تصادفی

### Quiz
- `POST /api/quiz/start` - شروع بازی
- `POST /api/quiz/answer` - ارسال پاسخ
- `GET /api/quiz/session/:id` - وضعیت بازی
- `POST /api/quiz/end` - پایان بازی

### User
- `GET /api/users/me` - پروفایل کاربر
- `GET /api/users/progress` - پیشرفت کاربر
- `GET /api/leaderboard` - جدول رده‌بندی

## 🚀 مراحل توسعه

### ✅ Phase 1: MVP (2-3 هفته)
- [ ] Setup پروژه (Frontend + Backend)
- [ ] Database Schema
- [ ] Authentication
- [ ] نمایش سوالات
- [ ] سیستم پاسخ‌دهی
- [ ] محاسبه امتیاز پایه

### ✅ Phase 2: Core Features (2-3 هفته)
- [ ] سیستم لِوِل و XP
- [ ] دسته‌بندی
- [ ] تایمر
- [ ] Leaderboard
- [ ] پروفایل کاربر

### ✅ Phase 3: Polish (1-2 هفته)
- [ ] UI/UX بهبود
- [ ] دستاوردها
- [ ] آمار و گزارش
- [ ] بهینه‌سازی

## 📝 نکات مهم

1. **Timer**: باید در Frontend اجرا شود اما validation در Backend
2. **Random Questions**: استفاده از algorithm مناسب برای جلوگیری از تکرار
3. **Caching**: Cache کردن سوالات پراستفاده در Redis
4. **Pagination**: برای لیست سوالات و Leaderboard
5. **Error Handling**: مدیریت خطاها در تمام لایه‌ها
6. **Logging**: Logging برای debugging و monitoring

## 🔄 Scalability Considerations

1. **Database**: Indexing مناسب، Query optimization
2. **Caching**: Redis برای کاهش load روی database
3. **CDN**: برای static assets
4. **Load Balancing**: در صورت نیاز
5. **Microservices**: در صورت رشد، تقسیم به سرویس‌های جداگانه

---

**نکته**: این سند خلاصه‌ای از طراحی فنی است. برای جزئیات بیشتر به `TECHNICAL_DESIGN.md` مراجعه کنید.

