# راهنمای Deployment

## 📋 فهرست

1. [Deployment با Docker](#deployment-با-docker)
2. [Deployment Manual](#deployment-manual)
3. [Environment Variables](#environment-variables)
4. [Database Migration](#database-migration)
5. [Monitoring](#monitoring)

---

## Deployment با Docker

### Development
```bash
docker-compose -f docker/docker-compose.yml up -d
```

### Production
```bash
# تنظیم environment variables
cp .env.example .env.production
# ویرایش .env.production

# Build و Run
docker-compose -f docker/docker-compose.prod.yml up -d --build
```

---

## Deployment Manual

### Backend

1. **Build**
```bash
cd backend
npm install --production
npm run build
```

2. **Run**
```bash
NODE_ENV=production npm start
```

### Frontend

1. **Build**
```bash
cd frontend
npm install --production
npm run build
```

2. **Run**
```bash
NODE_ENV=production npm start
```

---

## Environment Variables

### Production Backend
```env
NODE_ENV=production
PORT=3000
DB_HOST=your-db-host
DB_PASSWORD=strong-password
JWT_SECRET=very-strong-secret-min-32-chars
REDIS_PASSWORD=strong-redis-password
CORS_ORIGIN=https://yourdomain.com
```

### Production Frontend
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

---

## Database Migration

```bash
# در production
cd backend
npm run migrate
```

---

## Monitoring

### Health Check
```bash
curl https://api.yourdomain.com/health
```

### Logs
```bash
# Docker
docker-compose logs -f backend

# Manual
tail -f logs/combined.log
```

---

## SSL/HTTPS

استفاده از Nginx reverse proxy با Let's Encrypt:

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Backup

### Database Backup
```bash
pg_dump quiz_game > backup_$(date +%Y%m%d).sql
```

### Automated Backup
```bash
# Crontab
0 2 * * * /path/to/backup-script.sh
```

---

## Scaling

### Horizontal Scaling
- استفاده از Load Balancer (Nginx)
- Multiple backend instances
- Redis برای session sharing
- Database read replicas

---

**موفق باشید!** 🚀

