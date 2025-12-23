# ساختار پروژه Quiz Game

## 📁 ساختار کامل پروژه

```
quiz-game/
│
├── 📂 frontend/                    # Frontend Application
│   ├── public/
│   │   ├── favicon.ico
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── 📂 components/          # React Components
│   │   │   ├── 📂 common/         # کامپوننت‌های عمومی
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Loading.tsx
│   │   │   │   └── Timer.tsx
│   │   │   │
│   │   │   ├── 📂 quiz/           # کامپوننت‌های بازی
│   │   │   │   ├── QuestionCard.tsx
│   │   │   │   ├── AnswerOption.tsx
│   │   │   │   ├── QuizTimer.tsx
│   │   │   │   ├── ScoreDisplay.tsx
│   │   │   │   └── ResultsScreen.tsx
│   │   │   │
│   │   │   ├── 📂 user/           # کامپوننت‌های کاربر
│   │   │   │   ├── UserProfile.tsx
│   │   │   │   ├── LevelProgress.tsx
│   │   │   │   ├── AchievementBadge.tsx
│   │   │   │   └── StatsCard.tsx
│   │   │   │
│   │   │   └── 📂 layout/         # Layout Components
│   │   │       ├── Header.tsx
│   │   │       ├── Footer.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       └── Layout.tsx
│   │   │
│   │   ├── 📂 pages/              # Page Components
│   │   │   ├── HomePage.tsx       # صفحه اصلی
│   │   │   ├── LoginPage.tsx      # ورود
│   │   │   ├── RegisterPage.tsx   # ثبت‌نام
│   │   │   ├── CategorySelectPage.tsx  # انتخاب دسته
│   │   │   ├── QuizPage.tsx       # صفحه بازی
│   │   │   ├── ResultsPage.tsx    # نتایج
│   │   │   ├── ProfilePage.tsx    # پروفایل
│   │   │   ├── LeaderboardPage.tsx # جدول رده‌بندی
│   │   │   └── StatsPage.tsx      # آمار
│   │   │
│   │   ├── 📂 hooks/              # Custom Hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useQuiz.ts
│   │   │   ├── useTimer.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   └── useApi.ts
│   │   │
│   │   ├── 📂 services/           # API Services
│   │   │   ├── api/
│   │   │   │   ├── client.ts      # Axios instance
│   │   │   │   ├── authApi.ts
│   │   │   │   ├── questionApi.ts
│   │   │   │   ├── quizApi.ts
│   │   │   │   └── userApi.ts
│   │   │   │
│   │   │   └── storage/
│   │   │       └── tokenStorage.ts
│   │   │
│   │   ├── 📂 store/              # State Management
│   │   │   ├── userStore.ts       # User state
│   │   │   ├── quizStore.ts       # Quiz state
│   │   │   └── uiStore.ts         # UI state
│   │   │
│   │   ├── 📂 types/              # TypeScript Types
│   │   │   ├── user.types.ts
│   │   │   ├── question.types.ts
│   │   │   ├── quiz.types.ts
│   │   │   └── api.types.ts
│   │   │
│   │   ├── 📂 utils/              # Utility Functions
│   │   │   ├── formatters.ts      # Format numbers, dates
│   │   │   ├── validators.ts      # Form validation
│   │   │   ├── constants.ts       # Constants
│   │   │   └── helpers.ts         # Helper functions
│   │   │
│   │   ├── 📂 styles/             # Global Styles
│   │   │   ├── globals.css
│   │   │   └── tailwind.config.js
│   │   │
│   │   ├── 📂 context/            # React Context (optional)
│   │   │   └── AuthContext.tsx
│   │   │
│   │   ├── App.tsx                # Main App Component
│   │   ├── main.tsx               # Entry Point
│   │   └── router.tsx              # Routing
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts (or next.config.js)
│   └── .env
│
├── 📂 backend/                     # Backend Application
│   ├── src/
│   │   ├── 📂 controllers/        # Request Handlers
│   │   │   ├── authController.ts
│   │   │   ├── userController.ts
│   │   │   ├── questionController.ts
│   │   │   ├── quizController.ts
│   │   │   └── leaderboardController.ts
│   │   │
│   │   ├── 📂 services/           # Business Logic
│   │   │   ├── authService.ts
│   │   │   ├── userService.ts
│   │   │   ├── questionService.ts
│   │   │   ├── quizService.ts
│   │   │   ├── scoringService.ts
│   │   │   └── levelService.ts
│   │   │
│   │   ├── 📂 models/             # Database Models
│   │   │   ├── User.ts
│   │   │   ├── Question.ts
│   │   │   ├── Category.ts
│   │   │   ├── QuizSession.ts
│   │   │   ├── QuizAnswer.ts
│   │   │   └── Achievement.ts
│   │   │
│   │   ├── 📂 routes/             # API Routes
│   │   │   ├── index.ts
│   │   │   ├── authRoutes.ts
│   │   │   ├── userRoutes.ts
│   │   │   ├── questionRoutes.ts
│   │   │   ├── quizRoutes.ts
│   │   │   └── leaderboardRoutes.ts
│   │   │
│   │   ├── 📂 middleware/         # Express Middleware
│   │   │   ├── auth.ts            # JWT authentication
│   │   │   ├── validation.ts     # Request validation
│   │   │   ├── errorHandler.ts   # Error handling
│   │   │   ├── rateLimiter.ts    # Rate limiting
│   │   │   └── logger.ts          # Logging
│   │   │
│   │   ├── 📂 utils/              # Utilities
│   │   │   ├── database.ts        # DB connection
│   │   │   ├── jwt.ts             # JWT helpers
│   │   │   ├── bcrypt.ts          # Password hashing
│   │   │   ├── validators.ts      # Validation schemas
│   │   │   └── constants.ts       # Constants
│   │   │
│   │   ├── 📂 types/              # TypeScript Types
│   │   │   ├── express.d.ts       # Express type extensions
│   │   │   └── index.ts
│   │   │
│   │   ├── 📂 config/             # Configuration
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── env.ts
│   │   │
│   │   ├── app.ts                 # Express App Setup
│   │   └── server.ts              # Server Entry Point
│   │
│   ├── 📂 tests/                  # Tests
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── 📂 database/                    # Database Files
│   ├── 📂 migrations/             # Database Migrations
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_categories.sql
│   │   ├── 003_create_questions.sql
│   │   └── ...
│   │
│   ├── 📂 seeds/                  # Seed Data
│   │   ├── categories.seed.sql
│   │   ├── questions.seed.sql
│   │   └── achievements.seed.sql
│   │
│   └── schema.sql                 # Complete Schema
│
├── 📂 docker/                     # Docker Configuration
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.yml
│
├── 📂 docs/                       # Documentation
│   ├── TECHNICAL_DESIGN.md
│   ├── ARCHITECTURE_SUMMARY.md
│   ├── API.md                     # API Documentation
│   └── DEPLOYMENT.md              # Deployment Guide
│
├── .gitignore
├── README.md
└── package.json                   # Root package.json (monorepo)
```

## 🎯 توضیحات ماژول‌های کلیدی

### Frontend Components

#### `components/quiz/QuestionCard.tsx`
- نمایش سوال و گزینه‌های پاسخ
- مدیریت انتخاب کاربر
- نمایش تایمر

#### `components/quiz/QuizTimer.tsx`
- تایمر معکوس (30 ثانیه)
- نمایش بصری زمان باقیمانده
- اعلان زمان تمام شده

#### `components/user/LevelProgress.tsx`
- نمایش لِوِل فعلی
- نوار پیشرفت XP
- نمایش XP مورد نیاز برای لِوِل بعدی

### Backend Services

#### `services/quizService.ts`
- منطق شروع بازی
- انتخاب تصادفی سوالات
- مدیریت session

#### `services/scoringService.ts`
- محاسبه امتیاز بر اساس:
  - صحیح بودن پاسخ
  - زمان پاسخ
  - سطح دشواری

#### `services/levelService.ts`
- محاسبه لِوِل بر اساس XP
- بررسی ارتقای لِوِل
- محاسبه XP مورد نیاز

### Database Models

#### `models/User.ts`
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  level: number;
  xp: number;
  totalScore: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `models/Question.ts`
```typescript
interface Question {
  id: number;
  categoryId: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  questionText: string;
  correctAnswer: string;
  wrongAnswers: string[];
  explanation: string;
  points: number;
}
```

## 📦 Dependencies پیشنهادی

### Frontend
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "zustand": "^4.4.0",
    "framer-motion": "^10.16.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "@types/react": "^18.2.0"
  }
}
```

### Backend
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "typescript": "^5.3.0",
    "pg": "^8.11.0",
    "redis": "^4.6.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0",
    "nodemon": "^3.0.0"
  }
}
```

## 🚀 دستورات شروع پروژه

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run dev
```

### Database
```bash
# PostgreSQL
createdb quiz_game
psql quiz_game < database/schema.sql

# یا با Docker
docker-compose up -d postgres
```

## 📝 نکات مهم

1. **Environment Variables**: استفاده از `.env` برای تنظیمات
2. **TypeScript**: استفاده از TypeScript در تمام پروژه
3. **Error Handling**: مدیریت خطا در تمام لایه‌ها
4. **Validation**: Validation در Frontend و Backend
5. **Testing**: نوشتن تست برای منطق مهم
6. **Code Organization**: جداسازی concerns (separation of concerns)

---

این ساختار به عنوان راهنمای شروع پروژه استفاده می‌شود و می‌تواند بر اساس نیازهای پروژه تغییر کند.

