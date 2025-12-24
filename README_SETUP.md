# راهنمای نصب و راه‌اندازی Quiz Game

## 📋 پیش‌نیازها

- Node.js 20+ LTS
- PostgreSQL 12+
- Redis 6+ (اختیاری برای development)
- npm یا yarn

---

## 🚀 نصب و راه‌اندازی

### 1. Clone Repository

```bash
git clone <repository-url>
cd Quiz
```

### 2. نصب Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 3. تنظیم Database

#### ایجاد Database
```bash
# با استفاده از psql
psql -U postgres -p 5433 -h localhost

# سپس در psql:
CREATE DATABASE quiz_game;
\q
```

یا با دستور مستقیم:
```bash
createdb -U postgres -p 5433 -h localhost quiz_game
```

#### اجرای Schema
```bash
psql -U postgres -p 5433 -h localhost -d quiz_game -f database/schema_postgresql.sql
```

یا با PGPASSWORD:
```bash
PGPASSWORD=4522 psql -U postgres -p 5433 -h localhost -d quiz_game -f database/schema_postgresql.sql
```

#### Seed Data (اختیاری)
```bash
psql -U postgres -p 5433 -h localhost -d quiz_game -f database/seeds/initial_data.sql
```

یا با PGPASSWORD:
```bash
PGPASSWORD=4522 psql -U postgres -p 5433 -h localhost -d quiz_game -f database/seeds/initial_data.sql
```

### 4. تنظیم Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5433
DB_NAME=quiz_game
DB_USER=postgres
DB_PASSWORD=4522

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3001

LOG_LEVEL=info
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 5. راه‌اندازی Redis (اختیاری)

```bash
# با Docker
docker run -d -p 6379:6379 redis:7-alpine

# یا نصب محلی
redis-server
```

### 6. اجرای پروژه

#### Terminal 1: Backend
```bash
cd backend
npm run dev
```

Backend روی `http://localhost:3000` اجرا می‌شود.

#### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

Frontend روی `http://localhost:3001` اجرا می‌شود.

---

## 🧪 تست

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

---

## 📝 Scripts مفید

### Backend
```bash
npm run dev          # Development mode
npm run build        # Build for production
npm run start        # Start production server
npm test             # Run tests
npm run lint         # Lint code
npm run migrate      # Run database migrations
npm run seed         # Seed database
```

### Frontend
```bash
npm run dev          # Development mode
npm run build        # Build for production
npm run start        # Start production server
npm test             # Run tests
npm run lint         # Lint code
```

---

## 🔧 Troubleshooting

### مشکل اتصال به Database
- بررسی کنید PostgreSQL در حال اجرا باشد
- بررسی credentials در `.env`
- بررسی دسترسی database

### مشکل اتصال به Redis
- Redis اختیاری است برای development
- اگر Redis نصب نیست، leaderboard caching کار نمی‌کند اما بقیه features کار می‌کنند

### مشکل Port
- اگر port 3000 یا 3001 اشغال است، در `.env` تغییر دهید

---

## 📚 مستندات بیشتر

- [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) - جزئیات پیاده‌سازی
- [PRODUCTION_READY.md](./PRODUCTION_READY.md) - راهنمای Production
- [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md) - طراحی فنی
- [GAME_LOGIC.md](./GAME_LOGIC.md) - منطق بازی

---

## ✅ Checklist راه‌اندازی

- [ ] Node.js نصب شده
- [ ] PostgreSQL نصب و در حال اجرا
- [ ] Database ایجاد شده
- [ ] Schema اجرا شده
- [ ] Environment variables تنظیم شده
- [ ] Dependencies نصب شده
- [ ] Backend اجرا می‌شود
- [ ] Frontend اجرا می‌شود
- [ ] می‌توانید register/login کنید
- [ ] می‌توانید بازی را شروع کنید

---

**موفق باشید!** 🎉

