# راهنمای سریع شروع پروژه

## 📋 فهرست فایل‌های طراحی

1. **TECHNICAL_DESIGN.md** - طراحی فنی کامل و معماری سیستم
2. **ARCHITECTURE_SUMMARY.md** - خلاصه معماری با نمودارها
3. **PROJECT_STRUCTURE.md** - ساختار اولیه پروژه
4. **PRODUCTION_STRUCTURE.md** - ساختار کامل Production-ready ⭐
5. **MODULE_DETAILS.md** - جزئیات ماژول‌ها و مسئولیت‌ها ⭐

## 🎯 مراحل پیاده‌سازی

### Phase 1: Setup پروژه

#### 1.1 ایجاد ساختار پوشه‌ها
```bash
# Frontend
mkdir -p frontend/src/{app,components,hooks,services,store,types,utils,styles}
mkdir -p frontend/src/components/{ui,layout,quiz,user,leaderboard,common}

# Backend
mkdir -p backend/src/{modules,shared,infrastructure}
mkdir -p backend/src/modules/{auth,users,questions,quiz,progress,leaderboard}
mkdir -p backend/src/shared/{database,models,middleware,utils,types,config}

# Database
mkdir -p database/{migrations,seeds}
```

#### 1.2 نصب Dependencies

**Frontend:**
```bash
cd frontend
npm init -y
npm install react react-dom next typescript
npm install axios zustand tailwindcss
npm install -D @types/react @types/node
```

**Backend:**
```bash
cd backend
npm init -y
npm install express typescript pg redis jsonwebtoken bcryptjs zod
npm install -D @types/express @types/node @types/pg @types/jsonwebtoken
npm install -D ts-node nodemon
```

### Phase 2: Database Setup

#### 2.1 ایجاد Schema
```bash
# اجرای migrations
psql quiz_game < database/migrations/001_create_users_table.sql
psql quiz_game < database/migrations/002_create_categories_table.sql
# ... و بقیه
```

#### 2.2 Seed Data
```bash
psql quiz_game < database/seeds/categories.seed.sql
psql quiz_game < database/seeds/questions.seed.sql
```

### Phase 3: Backend Development

#### 3.1 شروع با ماژول Auth
1. ایجاد `modules/auth/dto/`
2. ایجاد `modules/auth/repositories/userRepository.ts`
3. ایجاد `modules/auth/services/authService.ts`
4. ایجاد `modules/auth/controllers/authController.ts`
5. ایجاد `modules/auth/routes/authRoutes.ts`

#### 3.2 اضافه کردن Middleware
1. `shared/middleware/auth.ts` - JWT authentication
2. `shared/middleware/errorHandler.ts` - Error handling
3. `shared/middleware/validation.ts` - Request validation

#### 3.3 ماژول Questions
1. `modules/questions/repositories/questionRepository.ts`
2. `modules/questions/services/questionService.ts`
3. `modules/questions/controllers/questionController.ts`

#### 3.4 ماژول Quiz
1. `modules/quiz/services/quizService.ts`
2. `modules/quiz/services/scoringService.ts`
3. `modules/quiz/services/timerService.ts`
4. `modules/quiz/controllers/quizController.ts`

#### 3.5 ماژول Progress
1. `modules/progress/services/levelService.ts`
2. `modules/progress/services/xpService.ts`

### Phase 4: Frontend Development

#### 4.1 Setup
1. تنظیم Next.js
2. تنظیم Tailwind CSS
3. ایجاد Layout components

#### 4.2 Authentication
1. ایجاد `services/api/authApi.ts`
2. ایجاد `store/slices/userSlice.ts`
3. ایجاد `hooks/useAuth.ts`
4. ایجاد صفحات Login و Register

#### 4.3 Quiz Components
1. `components/quiz/QuestionCard.tsx`
2. `components/quiz/QuizTimer.tsx`
3. `components/quiz/ScoreDisplay.tsx`
4. ایجاد صفحه Quiz

#### 4.4 Integration
1. اتصال Frontend به Backend
2. تست جریان کامل بازی

## 🔑 نکات مهم

### Backend
- همیشه از TypeScript استفاده کن
- تمام inputs را validate کن
- از Repository pattern برای database access
- از Service layer برای business logic
- Error handling در تمام لایه‌ها

### Frontend
- استفاده از TypeScript
- State management با Zustand
- API calls با Axios
- Error handling و loading states
- Responsive design

### Database
- استفاده از Migrations
- Indexes برای performance
- Foreign keys برای integrity
- Seed data برای development

## 📝 Checklist شروع

### Backend
- [ ] Setup Express app
- [ ] Database connection
- [ ] Auth module
- [ ] Question module
- [ ] Quiz module
- [ ] Progress module
- [ ] Error handling
- [ ] API documentation

### Frontend
- [ ] Next.js setup
- [ ] Tailwind CSS
- [ ] Authentication flow
- [ ] Quiz components
- [ ] State management
- [ ] API integration
- [ ] Error handling
- [ ] Loading states

### Infrastructure
- [ ] Docker setup
- [ ] Environment variables
- [ ] CI/CD pipeline
- [ ] Monitoring setup

## 🚀 دستورات مفید

### Development
```bash
# Backend
cd backend
npm run dev          # Start dev server

# Frontend
cd frontend
npm run dev          # Start dev server

# Database
docker-compose up -d # Start PostgreSQL
```

### Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Database
```bash
# Run migrations
npm run migrate

# Seed data
npm run seed
```

## 📚 منابع مفید

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

---

**نکته**: برای جزئیات بیشتر به فایل‌های دیگر مراجعه کنید:
- `PRODUCTION_STRUCTURE.md` برای ساختار کامل
- `MODULE_DETAILS.md` برای جزئیات ماژول‌ها
- `TECHNICAL_DESIGN.md` برای طراحی فنی

