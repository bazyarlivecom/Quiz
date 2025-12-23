# ساختار کامل پروژه Quiz Game - Production Ready

## 📁 ساختار کلی پروژه

```
quiz-game/
│
├── 📂 frontend/                          # Frontend Application
│   │
│   ├── 📂 public/                        # Static Assets
│   │   ├── favicon.ico
│   │   ├── logo.svg
│   │   ├── robots.txt
│   │   └── manifest.json
│   │
│   ├── 📂 src/
│   │   │
│   │   ├── 📂 app/                       # Next.js App Router (یا Pages)
│   │   │   ├── layout.tsx                # Root Layout
│   │   │   ├── page.tsx                  # Home Page
│   │   │   ├── (auth)/                   # Auth Group
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── register/
│   │   │   │       └── page.tsx
│   │   │   ├── (dashboard)/              # Protected Routes
│   │   │   │   ├── quiz/
│   │   │   │   │   ├── page.tsx          # Quiz Selection
│   │   │   │   │   └── [sessionId]/
│   │   │   │   │       └── page.tsx      # Active Quiz
│   │   │   │   ├── results/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── leaderboard/
│   │   │   │       └── page.tsx
│   │   │   └── api/                      # API Routes (Next.js)
│   │   │       └── health/
│   │   │           └── route.ts
│   │   │
│   │   ├── 📂 components/                # React Components
│   │   │   │
│   │   │   ├── 📂 ui/                    # Base UI Components (Shadcn/ui style)
│   │   │   │   ├── button/
│   │   │   │   │   ├── Button.tsx        # Button component
│   │   │   │   │   ├── Button.test.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── card/
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── modal/
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── input/
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── badge/
│   │   │   │   │   ├── Badge.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── progress/
│   │   │   │   │   ├── Progress.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts              # Export all UI components
│   │   │   │
│   │   │   ├── 📂 layout/                # Layout Components
│   │   │   │   ├── Header/
│   │   │   │   │   ├── Header.tsx        # Main header with nav
│   │   │   │   │   ├── Header.test.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Footer/
│   │   │   │   │   ├── Footer.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Sidebar/
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── MainLayout/
│   │   │   │   │   ├── MainLayout.tsx    # Wrapper layout
│   │   │   │   │   └── index.ts
│   │   │   │   └── ProtectedRoute/
│   │   │   │       ├── ProtectedRoute.tsx # Auth guard
│   │   │   │       └── index.ts
│   │   │   │
│   │   │   ├── 📂 quiz/                  # Quiz-specific Components
│   │   │   │   ├── QuestionCard/
│   │   │   │   │   ├── QuestionCard.tsx  # Display question & options
│   │   │   │   │   ├── QuestionCard.test.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── AnswerOption/
│   │   │   │   │   ├── AnswerOption.tsx  # Single answer option
│   │   │   │   │   └── index.ts
│   │   │   │   ├── QuizTimer/
│   │   │   │   │   ├── QuizTimer.tsx     # Countdown timer
│   │   │   │   │   ├── QuizTimer.test.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── ScoreDisplay/
│   │   │   │   │   ├── ScoreDisplay.tsx  # Current score display
│   │   │   │   │   └── index.ts
│   │   │   │   ├── QuestionProgress/
│   │   │   │   │   ├── QuestionProgress.tsx # Progress bar (3/10)
│   │   │   │   │   └── index.ts
│   │   │   │   ├── ResultsScreen/
│   │   │   │   │   ├── ResultsScreen.tsx # Final results
│   │   │   │   │   └── index.ts
│   │   │   │   └── CategorySelector/
│   │   │   │       ├── CategorySelector.tsx # Category selection
│   │   │   │       └── index.ts
│   │   │   │
│   │   │   ├── 📂 user/                  # User-related Components
│   │   │   │   ├── UserProfile/
│   │   │   │   │   ├── UserProfile.tsx   # User profile display
│   │   │   │   │   └── index.ts
│   │   │   │   ├── LevelProgress/
│   │   │   │   │   ├── LevelProgress.tsx # Level & XP progress
│   │   │   │   │   └── index.ts
│   │   │   │   ├── AchievementBadge/
│   │   │   │   │   ├── AchievementBadge.tsx # Achievement display
│   │   │   │   │   └── index.ts
│   │   │   │   ├── StatsCard/
│   │   │   │   │   ├── StatsCard.tsx     # Statistics card
│   │   │   │   │   └── index.ts
│   │   │   │   └── Avatar/
│   │   │   │       ├── Avatar.tsx
│   │   │   │       └── index.ts
│   │   │   │
│   │   │   ├── 📂 leaderboard/           # Leaderboard Components
│   │   │   │   ├── LeaderboardTable/
│   │   │   │   │   ├── LeaderboardTable.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── LeaderboardRow/
│   │   │   │   │   ├── LeaderboardRow.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   └── LeaderboardFilters/
│   │   │   │       ├── LeaderboardFilters.tsx
│   │   │   │       └── index.ts
│   │   │   │
│   │   │   └── 📂 common/                # Shared Components
│   │   │       ├── Loading/
│   │   │       │   ├── Loading.tsx       # Loading spinner
│   │   │       │   └── index.ts
│   │   │       ├── ErrorBoundary/
│   │   │       │   ├── ErrorBoundary.tsx # Error boundary
│   │   │       │   └── index.ts
│   │   │       ├── EmptyState/
│   │   │       │   ├── EmptyState.tsx    # Empty state display
│   │   │       │   └── index.ts
│   │   │       └── Toast/
│   │   │           ├── Toast.tsx         # Toast notifications
│   │   │           └── index.ts
│   │   │
│   │   ├── 📂 hooks/                     # Custom React Hooks
│   │   │   ├── useAuth.ts                # Authentication hook
│   │   │   ├── useQuiz.ts                # Quiz state management
│   │   │   ├── useTimer.ts               # Timer hook
│   │   │   ├── useLocalStorage.ts        # LocalStorage hook
│   │   │   ├── useApi.ts                 # API call hook
│   │   │   ├── useDebounce.ts            # Debounce hook
│   │   │   ├── useIntersectionObserver.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── 📂 services/                  # API & External Services
│   │   │   ├── 📂 api/
│   │   │   │   ├── client.ts             # Axios instance & config
│   │   │   │   ├── interceptors.ts       # Request/Response interceptors
│   │   │   │   ├── authApi.ts            # Auth endpoints
│   │   │   │   ├── questionApi.ts        # Question endpoints
│   │   │   │   ├── quizApi.ts            # Quiz endpoints
│   │   │   │   ├── userApi.ts            # User endpoints
│   │   │   │   ├── leaderboardApi.ts     # Leaderboard endpoints
│   │   │   │   └── types.ts              # API response types
│   │   │   │
│   │   │   ├── 📂 storage/
│   │   │   │   ├── tokenStorage.ts       # JWT token storage
│   │   │   │   ├── localStorage.ts       # LocalStorage wrapper
│   │   │   │   └── sessionStorage.ts     # SessionStorage wrapper
│   │   │   │
│   │   │   └── 📂 analytics/
│   │   │       ├── analytics.ts          # Analytics tracking
│   │   │       └── events.ts             # Event definitions
│   │   │
│   │   ├── 📂 store/                     # State Management (Zustand)
│   │   │   ├── 📂 slices/
│   │   │   │   ├── userSlice.ts          # User state slice
│   │   │   │   ├── quizSlice.ts          # Quiz state slice
│   │   │   │   ├── uiSlice.ts            # UI state slice
│   │   │   │   └── notificationSlice.ts  # Notification state
│   │   │   │
│   │   │   ├── store.ts                  # Store configuration
│   │   │   └── hooks.ts                  # Typed hooks
│   │   │
│   │   ├── 📂 types/                     # TypeScript Type Definitions
│   │   │   ├── user.types.ts             # User types
│   │   │   ├── question.types.ts         # Question types
│   │   │   ├── quiz.types.ts             # Quiz types
│   │   │   ├── api.types.ts              # API types
│   │   │   ├── common.types.ts           # Common types
│   │   │   └── index.ts                  # Re-export all types
│   │   │
│   │   ├── 📂 utils/                     # Utility Functions
│   │   │   ├── formatters.ts             # Format numbers, dates
│   │   │   ├── validators.ts             # Form validation
│   │   │   ├── constants.ts              # App constants
│   │   │   ├── helpers.ts                # Helper functions
│   │   │   ├── errors.ts                 # Error handling utils
│   │   │   └── date.ts                   # Date utilities
│   │   │
│   │   ├── 📂 styles/                    # Global Styles
│   │   │   ├── globals.css               # Global CSS
│   │   │   ├── variables.css             # CSS variables
│   │   │   └── tailwind.config.ts        # Tailwind config
│   │   │
│   │   ├── 📂 context/                   # React Context (if needed)
│   │   │   ├── AuthContext.tsx           # Auth context
│   │   │   └── ThemeContext.tsx          # Theme context
│   │   │
│   │   ├── 📂 config/                     # Configuration
│   │   │   ├── env.ts                    # Environment variables
│   │   │   └── routes.ts                 # Route definitions
│   │   │
│   │   ├── 📂 lib/                       # Third-party lib configs
│   │   │   └── utils.ts                  # Utility functions for libs
│   │   │
│   │   ├── App.tsx                       # Main App Component
│   │   ├── main.tsx                      # Entry Point
│   │   └── router.tsx                    # Router configuration
│   │
│   ├── 📂 tests/                         # Test Files
│   │   ├── setup.ts                      # Test setup
│   │   ├── mocks/                        # Mock data
│   │   └── __mocks__/                    # Jest mocks
│   │
│   ├── 📂 .next/                         # Next.js build (generated)
│   │
│   ├── .env.local                        # Local environment variables
│   ├── .env.example                      # Example env file
│   ├── .eslintrc.json                    # ESLint config
│   ├── .prettierrc                       # Prettier config
│   ├── jest.config.js                    # Jest config
│   ├── next.config.js                    # Next.js config
│   ├── package.json
│   ├── tsconfig.json                     # TypeScript config
│   └── README.md
│
├── 📂 backend/                           # Backend Application
│   │
│   ├── 📂 src/
│   │   │
│   │   ├── 📂 modules/                   # Feature Modules (Domain-Driven)
│   │   │   │
│   │   │   ├── 📂 auth/                  # Authentication Module
│   │   │   │   ├── 📂 controllers/
│   │   │   │   │   └── authController.ts # Auth endpoints handler
│   │   │   │   ├── 📂 services/
│   │   │   │   │   ├── authService.ts    # Auth business logic
│   │   │   │   │   └── tokenService.ts   # JWT token management
│   │   │   │   ├── 📂 repositories/
│   │   │   │   │   └── userRepository.ts # User data access
│   │   │   │   ├── 📂 dto/
│   │   │   │   │   ├── loginDto.ts       # Login DTO
│   │   │   │   │   ├── registerDto.ts    # Register DTO
│   │   │   │   │   └── authResponseDto.ts
│   │   │   │   ├── 📂 validators/
│   │   │   │   │   └── authValidator.ts  # Request validation
│   │   │   │   ├── 📂 routes/
│   │   │   │   │   └── authRoutes.ts     # Auth routes
│   │   │   │   └── index.ts              # Module exports
│   │   │   │
│   │   │   ├── 📂 users/                 # User Management Module
│   │   │   │   ├── 📂 controllers/
│   │   │   │   │   └── userController.ts
│   │   │   │   ├── 📂 services/
│   │   │   │   │   ├── userService.ts
│   │   │   │   │   └── profileService.ts
│   │   │   │   ├── 📂 repositories/
│   │   │   │   │   └── userRepository.ts
│   │   │   │   ├── 📂 dto/
│   │   │   │   │   ├── userDto.ts
│   │   │   │   │   └── updateProfileDto.ts
│   │   │   │   ├── 📂 routes/
│   │   │   │   │   └── userRoutes.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── 📂 questions/             # Question Management Module
│   │   │   │   ├── 📂 controllers/
│   │   │   │   │   └── questionController.ts
│   │   │   │   ├── 📂 services/
│   │   │   │   │   ├── questionService.ts
│   │   │   │   │   └── categoryService.ts
│   │   │   │   ├── 📂 repositories/
│   │   │   │   │   ├── questionRepository.ts
│   │   │   │   │   └── categoryRepository.ts
│   │   │   │   ├── 📂 dto/
│   │   │   │   │   ├── questionDto.ts
│   │   │   │   │   └── createQuestionDto.ts
│   │   │   │   ├── 📂 routes/
│   │   │   │   │   └── questionRoutes.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── 📂 quiz/                  # Quiz Game Module
│   │   │   │   ├── 📂 controllers/
│   │   │   │   │   └── quizController.ts
│   │   │   │   ├── 📂 services/
│   │   │   │   │   ├── quizService.ts    # Quiz session management
│   │   │   │   │   ├── scoringService.ts # Score calculation
│   │   │   │   │   └── timerService.ts   # Timer validation
│   │   │   │   ├── 📂 repositories/
│   │   │   │   │   ├── quizSessionRepository.ts
│   │   │   │   │   └── quizAnswerRepository.ts
│   │   │   │   ├── 📂 dto/
│   │   │   │   │   ├── startQuizDto.ts
│   │   │   │   │   ├── answerDto.ts
│   │   │   │   │   └── quizResultDto.ts
│   │   │   │   ├── 📂 routes/
│   │   │   │   │   └── quizRoutes.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── 📂 progress/              # Progress & Level Module
│   │   │   │   ├── 📂 services/
│   │   │   │   │   ├── levelService.ts   # Level calculation
│   │   │   │   │   ├── xpService.ts      # XP management
│   │   │   │   │   └── achievementService.ts
│   │   │   │   ├── 📂 repositories/
│   │   │   │   │   └── progressRepository.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── 📂 leaderboard/           # Leaderboard Module
│   │   │       ├── 📂 controllers/
│   │   │       │   └── leaderboardController.ts
│   │   │       ├── 📂 services/
│   │   │       │   └── leaderboardService.ts
│   │   │       ├── 📂 repositories/
│   │   │       │   └── leaderboardRepository.ts
│   │   │       ├── 📂 routes/
│   │   │       │   └── leaderboardRoutes.ts
│   │   │       └── index.ts
│   │   │
│   │   ├── 📂 shared/                    # Shared Code
│   │   │   ├── 📂 database/
│   │   │   │   ├── connection.ts         # DB connection pool
│   │   │   │   ├── migrations.ts         # Migration runner
│   │   │   │   └── seeds.ts              # Seed data
│   │   │   │
│   │   │   ├── 📂 models/                # Database Models (TypeORM/Prisma)
│   │   │   │   ├── User.ts
│   │   │   │   ├── Question.ts
│   │   │   │   ├── Category.ts
│   │   │   │   ├── QuizSession.ts
│   │   │   │   ├── QuizAnswer.ts
│   │   │   │   ├── Achievement.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── 📂 middleware/            # Express Middleware
│   │   │   │   ├── auth.ts               # JWT authentication
│   │   │   │   ├── validation.ts         # Request validation
│   │   │   │   ├── errorHandler.ts       # Global error handler
│   │   │   │   ├── rateLimiter.ts        # Rate limiting
│   │   │   │   ├── logger.ts             # Request logging
│   │   │   │   ├── cors.ts               # CORS config
│   │   │   │   └── security.ts           # Security headers
│   │   │   │
│   │   │   ├── 📂 utils/
│   │   │   │   ├── jwt.ts                # JWT helpers
│   │   │   │   ├── bcrypt.ts             # Password hashing
│   │   │   │   ├── validators.ts         # Validation schemas (Zod)
│   │   │   │   ├── constants.ts          # Constants
│   │   │   │   ├── errors.ts             # Custom error classes
│   │   │   │   ├── logger.ts             # Logger utility
│   │   │   │   └── response.ts           # Response formatter
│   │   │   │
│   │   │   ├── 📂 types/
│   │   │   │   ├── express.d.ts          # Express type extensions
│   │   │   │   ├── database.d.ts         # DB types
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── 📂 config/
│   │   │       ├── database.ts           # DB config
│   │   │       ├── redis.ts              # Redis config
│   │   │       ├── env.ts                # Environment config
│   │   │       └── app.ts                # App config
│   │   │
│   │   ├── 📂 infrastructure/            # Infrastructure Layer
│   │   │   ├── 📂 cache/
│   │   │   │   ├── redisClient.ts        # Redis client
│   │   │   │   └── cacheService.ts       # Cache service
│   │   │   │
│   │   │   ├── 📂 queue/
│   │   │   │   └── queueService.ts       # Job queue (Bull/BullMQ)
│   │   │   │
│   │   │   └── 📂 monitoring/
│   │   │       ├── metrics.ts            # Metrics collection
│   │   │       └── healthCheck.ts        # Health check
│   │   │
│   │   ├── app.ts                        # Express App Setup
│   │   └── server.ts                    # Server Entry Point
│   │
│   ├── 📂 tests/                         # Test Files
│   │   ├── 📂 unit/                      # Unit Tests
│   │   │   ├── services/
│   │   │   ├── controllers/
│   │   │   └── utils/
│   │   │
│   │   ├── 📂 integration/                # Integration Tests
│   │   │   ├── api/
│   │   │   └── database/
│   │   │
│   │   ├── 📂 e2e/                       # E2E Tests
│   │   │   └── quiz.flow.test.ts
│   │   │
│   │   ├── setup.ts                      # Test setup
│   │   ├── teardown.ts                   # Test teardown
│   │   └── fixtures/                     # Test fixtures
│   │
│   ├── 📂 scripts/                       # Utility Scripts
│   │   ├── seed.ts                       # Seed database
│   │   ├── migrate.ts                    # Run migrations
│   │   └── generate-types.ts             # Generate types from DB
│   │
│   ├── 📂 docs/                          # API Documentation
│   │   └── api.yaml                      # OpenAPI/Swagger spec
│   │
│   ├── .env                              # Environment variables
│   ├── .env.example                      # Example env file
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── jest.config.js
│   ├── tsconfig.json
│   ├── package.json
│   └── README.md
│
├── 📂 database/                          # Database Files
│   ├── 📂 migrations/                    # Database Migrations
│   │   ├── 001_create_users_table.sql
│   │   ├── 002_create_categories_table.sql
│   │   ├── 003_create_questions_table.sql
│   │   ├── 004_create_quiz_sessions_table.sql
│   │   ├── 005_create_quiz_answers_table.sql
│   │   ├── 006_create_achievements_table.sql
│   │   ├── 007_create_indexes.sql
│   │   └── 008_add_foreign_keys.sql
│   │
│   ├── 📂 seeds/                         # Seed Data
│   │   ├── categories.seed.sql
│   │   ├── questions.seed.sql
│   │   ├── achievements.seed.sql
│   │   └── admin_user.seed.sql
│   │
│   ├── schema.sql                        # Complete Schema
│   └── README.md
│
├── 📂 docker/                            # Docker Configuration
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   ├── docker-compose.yml                # Local development
│   ├── docker-compose.prod.yml           # Production
│   └── .dockerignore
│
├── 📂 infrastructure/                    # Infrastructure as Code
│   ├── 📂 kubernetes/                    # K8s manifests (optional)
│   │   ├── frontend-deployment.yaml
│   │   ├── backend-deployment.yaml
│   │   └── postgres-deployment.yaml
│   │
│   └── 📂 terraform/                     # Terraform (optional)
│       └── main.tf
│
├── 📂 docs/                              # Project Documentation
│   ├── TECHNICAL_DESIGN.md
│   ├── ARCHITECTURE_SUMMARY.md
│   ├── API.md                            # API Documentation
│   ├── DEPLOYMENT.md                     # Deployment Guide
│   ├── DEVELOPMENT.md                    # Development Guide
│   └── CONTRIBUTING.md                   # Contributing Guide
│
├── 📂 .github/                           # GitHub Configuration
│   ├── 📂 workflows/                     # CI/CD Pipelines
│   │   ├── ci.yml                        # Continuous Integration
│   │   ├── cd.yml                        # Continuous Deployment
│   │   └── test.yml                      # Test pipeline
│   │
│   └── ISSUE_TEMPLATE/
│       └── bug_report.md
│
├── .gitignore
├── .editorconfig
├── LICENSE
└── README.md                             # Project README
```

---

## 📋 توضیحات مسئولیت فایل‌های کلیدی

### Frontend

#### `src/components/ui/`
**مسئولیت**: کامپوننت‌های پایه UI که در تمام پروژه استفاده می‌شوند
- `Button.tsx`: دکمه قابل استفاده مجدد با variants مختلف
- `Card.tsx`: کارت برای نمایش محتوا
- `Modal.tsx`: مودال برای نمایش محتوای overlay
- `Input.tsx`: فیلد ورودی با validation
- `Progress.tsx`: نوار پیشرفت

#### `src/components/quiz/`
**مسئولیت**: کامپوننت‌های مخصوص بازی
- `QuestionCard.tsx`: نمایش سوال و 4 گزینه پاسخ
- `QuizTimer.tsx`: تایمر معکوس 30 ثانیه‌ای با نمایش بصری
- `ScoreDisplay.tsx`: نمایش امتیاز فعلی
- `ResultsScreen.tsx`: صفحه نتایج نهایی با آمار

#### `src/hooks/`
**مسئولیت**: Custom hooks برای منطق قابل استفاده مجدد
- `useAuth.ts`: مدیریت authentication state
- `useQuiz.ts`: مدیریت state بازی (سوالات، پاسخ‌ها، امتیاز)
- `useTimer.ts`: منطق تایمر با cleanup
- `useApi.ts`: wrapper برای API calls با loading/error states

#### `src/services/api/`
**مسئولیت**: ارتباط با Backend API
- `client.ts`: تنظیم Axios instance با base URL و interceptors
- `interceptors.ts`: اضافه کردن token به headers، handle errors
- `authApi.ts`: login, register, logout endpoints
- `quizApi.ts`: start quiz, submit answer, get results

#### `src/store/`
**مسئولیت**: State management با Zustand
- `slices/userSlice.ts`: User state (info, level, xp)
- `slices/quizSlice.ts`: Quiz state (session, questions, answers)
- `store.ts`: ترکیب تمام slices

---

### Backend

#### `src/modules/`
**مسئولیت**: ماژول‌های مستقل بر اساس Domain-Driven Design

##### `auth/`
- `controllers/authController.ts`: Handle HTTP requests (login, register)
- `services/authService.ts`: Business logic (validate credentials, generate tokens)
- `repositories/userRepository.ts`: Database queries برای users
- `dto/`: Data Transfer Objects برای validation و type safety

##### `quiz/`
- `services/quizService.ts`: 
  - ایجاد session جدید
  - انتخاب تصادفی سوالات
  - مدیریت state بازی
- `services/scoringService.ts`:
  - محاسبه امتیاز بر اساس formula
  - اعمال time bonus و difficulty multiplier
- `services/timerService.ts`:
  - Validation زمان پاسخ (prevent cheating)
  - محاسبه time bonus

##### `progress/`
- `services/levelService.ts`:
  - محاسبه level از XP
  - بررسی level up
  - محاسبه XP مورد نیاز
- `services/xpService.ts`:
  - اضافه کردن XP
  - محاسبه XP بر اساس difficulty

#### `src/shared/middleware/`
**مسئولیت**: Express middleware برای cross-cutting concerns
- `auth.ts`: بررسی JWT token و attach user به request
- `errorHandler.ts`: Catch errors و return formatted response
- `rateLimiter.ts`: محدود کردن requests per IP
- `logger.ts`: Log تمام requests

#### `src/shared/utils/`
**مسئولیت**: Utility functions
- `jwt.ts`: Generate و verify JWT tokens
- `bcrypt.ts`: Hash و compare passwords
- `validators.ts`: Zod schemas برای validation
- `errors.ts`: Custom error classes (NotFoundError, ValidationError)

#### `src/infrastructure/`
**مسئولیت**: Infrastructure concerns
- `cache/redisClient.ts`: Connection به Redis
- `cache/cacheService.ts`: Cache operations (get, set, delete)
- `monitoring/healthCheck.ts`: Health check endpoint

---

### Database

#### `migrations/`
**مسئولیت**: Version control برای database schema
- هر migration یک تغییر در schema
- قابل rollback
- ترتیب اجرا مهم است

#### `seeds/`
**مسئولیت**: داده‌های اولیه
- `categories.seed.sql`: دسته‌بندی‌های پیش‌فرض
- `questions.seed.sql`: سوالات نمونه
- `achievements.seed.sql`: دستاوردهای پیش‌فرض

---

## 🔄 جریان داده (Data Flow)

### مثال: شروع یک بازی

```
1. Frontend: User clicks "Start Quiz"
   ↓
2. Frontend: quizApi.startQuiz({ categoryId, difficulty })
   ↓
3. Backend: quizController.startQuiz()
   ↓
4. Backend: quizService.createSession()
   ↓
5. Backend: questionRepository.getRandomQuestions()
   ↓
6. Backend: quizSessionRepository.create()
   ↓
7. Backend: Return sessionId + questions
   ↓
8. Frontend: Store in quizStore
   ↓
9. Frontend: Display first question
```

---

## 🎯 اصول طراحی

1. **Separation of Concerns**: هر ماژول مسئولیت مشخص دارد
2. **DRY (Don't Repeat Yourself)**: استفاده از shared utilities
3. **SOLID Principles**: خصوصاً Single Responsibility
4. **Type Safety**: استفاده کامل از TypeScript
5. **Error Handling**: مدیریت خطا در تمام لایه‌ها
6. **Testing**: Unit, Integration, E2E tests
7. **Documentation**: JSDoc برای functions مهم
8. **Security**: Input validation, SQL injection prevention
9. **Performance**: Caching, Database indexing
10. **Scalability**: آماده برای horizontal scaling

---

این ساختار برای یک پروژه Production-ready طراحی شده و شامل تمام جنبه‌های لازم برای توسعه، تست، و deploy است.

