# تنظیمات Environment Variables

## فایل .env

فایل `backend/.env` را با محتوای زیر ایجاد کنید:

```env
# Application
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5433
DB_NAME=quiz_game
DB_USER=postgres
DB_PASSWORD=4522

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3001

# Logging
LOG_LEVEL=info
```

## ایجاد فایل

### Windows PowerShell
```powershell
cd backend
Copy-Item -Path ".env.example" -Destination ".env" -ErrorAction SilentlyContinue
# سپس فایل .env را ویرایش کنید
```

### Linux/Mac
```bash
cd backend
cp .env.example .env
# سپس فایل .env را ویرایش کنید
```

یا به صورت دستی فایل `backend/.env` را ایجاد کنید و محتوای بالا را در آن قرار دهید.

