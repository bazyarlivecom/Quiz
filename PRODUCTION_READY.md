# راهنمای آماده‌سازی برای Production

این سند شامل تمام تنظیمات، بهینه‌سازی‌ها و نکات امنیتی برای آماده‌سازی پروژه Quiz Game برای محیط Production است.

---

## 📋 فهرست

1. [تنظیمات Production](#1-تنظیمات-production)
2. [بهینه‌سازی Performance](#2-بهینه‌سازی-performance)
3. [امنیت](#3-امنیت)
4. [مقیاس‌پذیری](#4-مقیاس‌پذیری)
5. [Monitoring & Logging](#5-monitoring--logging)
6. [Deployment](#6-deployment)
7. [Backup & Recovery](#7-backup--recovery)

---

## 1. تنظیمات Production

### 1.1. Environment Variables

```bash
# .env.production

# Application
NODE_ENV=production
PORT=3000
API_URL=https://api.quizgame.com
FRONTEND_URL=https://quizgame.com

# Database
DB_HOST=postgres.quizgame.com
DB_PORT=5432
DB_NAME=quizgame_prod
DB_USER=quizgame_user
DB_PASSWORD=<strong-password>
DB_SSL=true
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=30000

# Redis
REDIS_HOST=redis.quizgame.com
REDIS_PORT=6379
REDIS_PASSWORD=<strong-password>
REDIS_TLS=true

# JWT
JWT_SECRET=<very-strong-secret-key-min-32-chars>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<different-strong-secret>
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://quizgame.com
SESSION_SECRET=<strong-session-secret>

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@quizgame.com
SMTP_PASSWORD=<smtp-password>

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=/var/uploads

# Logging
LOG_LEVEL=info
LOG_FILE=/var/logs/quizgame/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=14

# Monitoring
SENTRY_DSN=<sentry-dsn>
NEW_RELIC_LICENSE_KEY=<new-relic-key>
```

### 1.2. TypeScript Configuration

```json
// tsconfig.production.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "sourceMap": false,
    "removeComments": true,
    "declaration": false,
    "incremental": false,
    "tsBuildInfoFile": null
  },
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "node_modules",
    "tests"
  ]
}
```

### 1.3. Build Configuration

```json
// package.json
{
  "scripts": {
    "build": "tsc -p tsconfig.production.json",
    "build:frontend": "next build",
    "start:prod": "NODE_ENV=production node dist/index.js",
    "start:prod:pm2": "pm2 start ecosystem.config.js",
    "migrate:prod": "NODE_ENV=production node dist/migrations/run.js"
  }
}
```

### 1.4. PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'quiz-game-api',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/logs/quizgame/error.log',
    out_file: '/var/logs/quizgame/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    watch: false,
    ignore_watch: ['node_modules', 'logs']
  }]
};
```

---

## 2. بهینه‌سازی Performance

### 2.1. Database Optimization

#### Indexes

```sql
-- Performance-critical indexes
CREATE INDEX CONCURRENTLY idx_matches_user_active 
ON matches(user_id, started_at DESC) 
WHERE status = 'ACTIVE';

CREATE INDEX CONCURRENTLY idx_user_answers_match_question 
ON user_answers(match_id, question_id);

CREATE INDEX CONCURRENTLY idx_questions_category_difficulty 
ON questions(category_id, difficulty) 
WHERE is_active = true;

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY idx_users_active_high_score 
ON users(total_score DESC, level DESC) 
WHERE is_active = true;

-- Composite indexes
CREATE INDEX CONCURRENTLY idx_match_questions_order 
ON match_questions(match_id, question_order);
```

#### Query Optimization

```typescript
// backend/src/shared/database/queryOptimizer.ts

export class QueryOptimizer {
    /**
     * استفاده از Prepared Statements
     */
    static async getQuestionsOptimized(categoryId: number, limit: number) {
        return db.query(`
            SELECT q.*, 
                   json_agg(
                       json_build_object(
                           'id', o.id,
                           'text', o.option_text,
                           'order', o.option_order
                       ) ORDER BY o.option_order
                   ) as options
            FROM questions q
            LEFT JOIN question_options o ON q.id = o.question_id
            WHERE q.category_id = $1 
              AND q.is_active = true
            GROUP BY q.id
            ORDER BY random()
            LIMIT $2
        `, [categoryId, limit]);
    }

    /**
     * استفاده از EXPLAIN برای بهینه‌سازی
     */
    static async analyzeQuery(query: string, params: any[]) {
        const explainQuery = `EXPLAIN ANALYZE ${query}`;
        return db.query(explainQuery, params);
    }

    /**
     * Connection Pooling
     */
    static configurePool() {
        return {
            min: parseInt(process.env.DB_POOL_MIN || '5'),
            max: parseInt(process.env.DB_POOL_MAX || '20'),
            idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
            connectionTimeoutMillis: 2000
        };
    }
}
```

#### Database Connection Pool

```typescript
// backend/src/shared/database/connection.ts

import { Pool } from 'pg';

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    min: parseInt(process.env.DB_POOL_MIN || '5'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export { pool as db };
```

### 2.2. Redis Caching

```typescript
// backend/src/shared/cache/redisCache.ts

import Redis from 'ioredis';

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3
});

export class CacheService {
    /**
     * Cache با TTL
     */
    static async set(key: string, value: any, ttl: number = 3600): Promise<void> {
        await redis.setex(key, ttl, JSON.stringify(value));
    }

    /**
     * دریافت از Cache
     */
    static async get<T>(key: string): Promise<T | null> {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Cache Leaderboard
     */
    static async cacheLeaderboard(type: string, data: any[]): Promise<void> {
        await this.set(`leaderboard:${type}`, data, 300); // 5 minutes
    }

    /**
     * Cache User Profile
     */
    static async cacheUserProfile(userId: number, data: any): Promise<void> {
        await this.set(`user:${userId}:profile`, data, 1800); // 30 minutes
    }

    /**
     * Cache Questions
     */
    static async cacheQuestions(categoryId: number, difficulty: string, data: any[]): Promise<void> {
        await this.set(`questions:${categoryId}:${difficulty}`, data, 3600); // 1 hour
    }

    /**
     * Invalidate Cache
     */
    static async invalidate(pattern: string): Promise<void> {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    }
}

export { redis };
```

### 2.3. API Response Optimization

```typescript
// backend/src/middleware/responseOptimizer.ts

import { Request, Response, NextFunction } from 'express';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

export async function compressResponse(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const originalSend = res.send;

    res.send = function(data: any) {
        const acceptEncoding = req.headers['accept-encoding'] || '';

        if (acceptEncoding.includes('gzip') && data && data.length > 1024) {
            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Vary', 'Accept-Encoding');

            gzipAsync(Buffer.from(data))
                .then((compressed) => {
                    res.setHeader('Content-Length', compressed.length);
                    originalSend.call(this, compressed);
                })
                .catch((err) => {
                    console.error('Compression error:', err);
                    originalSend.call(this, data);
                });
        } else {
            originalSend.call(this, data);
        }
    };

    next();
}
```

### 2.4. Frontend Optimization

```javascript
// next.config.js
module.exports = {
    // Production optimizations
    compress: true,
    poweredByHeader: false,
    
    // Image optimization
    images: {
        domains: ['cdn.quizgame.com'],
        formats: ['image/avif', 'image/webp'],
    },

    // Bundle optimization
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.optimization.splitChunks = {
                chunks: 'all',
                cacheGroups: {
                    default: false,
                    vendors: false,
                    vendor: {
                        name: 'vendor',
                        chunks: 'all',
                        test: /node_modules/,
                        priority: 20
                    },
                    common: {
                        name: 'common',
                        minChunks: 2,
                        chunks: 'all',
                        priority: 10,
                        reuseExistingChunk: true,
                        enforce: true
                    }
                }
            };
        }
        return config;
    },

    // Headers for security and performance
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    }
                ]
            }
        ];
    }
};
```

### 2.5. CDN Configuration

```typescript
// frontend/next.config.js - CDN setup
module.exports = {
    assetPrefix: process.env.CDN_URL || '',
    basePath: '',
    
    // Static assets optimization
    generateBuildId: async () => {
        return process.env.BUILD_ID || 'latest';
    }
};
```

---

## 3. امنیت

### 3.1. Security Headers

```typescript
// backend/src/middleware/security.ts

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

export function setupSecurity(app: Express): void {
    // Helmet for security headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", process.env.API_URL || ''],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        },
        noSniff: true,
        xssFilter: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    }));

    // Rate limiting
    app.use(rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    }));

    // CORS
    app.use(cors({
        origin: process.env.CORS_ORIGIN || 'https://quizgame.com',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
}
```

### 3.2. Input Validation & Sanitization

```typescript
// backend/src/middleware/validation.ts

import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';

export const validate = (validations: any[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        next();
    };
};

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    // Sanitize string inputs
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = DOMPurify.sanitize(req.body[key]);
            }
        });
    }

    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = DOMPurify.sanitize(req.query[key] as string);
            }
        });
    }

    next();
};

// Example validation rules
export const registerValidation = [
    body('email').isEmail().normalizeEmail(),
    body('username')
        .trim()
        .isLength({ min: 3, max: 20 })
        .matches(/^[a-zA-Z0-9_]+$/),
    body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
];
```

### 3.3. SQL Injection Prevention

```typescript
// backend/src/shared/database/safeQuery.ts

import { db } from './connection';

/**
 * استفاده از Parameterized Queries
 */
export async function safeQuery<T>(
    query: string,
    params: any[]
): Promise<T[]> {
    // Validate query doesn't contain dangerous patterns
    const dangerousPatterns = [
        /;\s*(DROP|DELETE|TRUNCATE|ALTER|CREATE)\s+/i,
        /--/,
        /\/\*/,
        /xp_/i,
        /sp_/i
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(query)) {
            throw new Error('Potentially dangerous query detected');
        }
    }

    // Use parameterized query
    return db.query(query, params);
}
```

### 3.4. Authentication & Authorization

```typescript
// backend/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../modules/users/repositories/userRepository';

export interface AuthRequest extends Request {
    userId?: number;
    user?: any;
}

export async function authenticate(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
        const userRepo = new UserRepository();
        const user = await userRepo.findById(decoded.userId);

        if (!user || !user.is_active) {
            res.status(401).json({ error: 'Invalid or inactive user' });
            return;
        }

        req.userId = decoded.userId;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

export function requireRole(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }

        next();
    };
}
```

### 3.5. Password Security

```typescript
// backend/src/shared/utils/password.ts

import bcrypt from 'bcrypt';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): boolean {
    // Minimum 8 characters, at least one uppercase, one lowercase, one number, one special char
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return pattern.test(password);
}
```

### 3.6. HTTPS & SSL/TLS

```typescript
// backend/src/server.ts

import https from 'https';
import fs from 'fs';
import express from 'express';

const app = express();

// SSL/TLS Configuration
if (process.env.NODE_ENV === 'production') {
    const options = {
        key: fs.readFileSync('/etc/ssl/private/quizgame.key'),
        cert: fs.readFileSync('/etc/ssl/certs/quizgame.crt'),
        ca: fs.readFileSync('/etc/ssl/certs/quizgame-chain.crt')
    };

    https.createServer(options, app).listen(443, () => {
        console.log('HTTPS server running on port 443');
    });

    // Redirect HTTP to HTTPS
    express().use((req, res) => {
        res.redirect(`https://${req.hostname}${req.url}`);
    }).listen(80);
}
```

---

## 4. مقیاس‌پذیری

### 4.1. Load Balancing

```nginx
# /etc/nginx/nginx.conf

upstream backend {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
    keepalive 32;
}

server {
    listen 80;
    server_name api.quizgame.com;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 4.2. Horizontal Scaling

```typescript
// backend/src/shared/cluster/clusterManager.ts

import cluster from 'cluster';
import os from 'os';

export function setupCluster(callback: () => void): void {
    const numCPUs = os.cpus().length;

    if (cluster.isPrimary) {
        console.log(`Master ${process.pid} is running`);

        // Fork workers
        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }

        cluster.on('exit', (worker, code, signal) => {
            console.log(`Worker ${worker.process.pid} died`);
            console.log('Starting a new worker');
            cluster.fork();
        });
    } else {
        callback();
    }
}
```

### 4.3. Database Scaling

```sql
-- Read Replicas Configuration
-- Master: Write operations
-- Replicas: Read operations

-- Connection string for reads
-- postgresql://readonly:password@replica1.quizgame.com:5432/quizgame

-- Connection string for writes
-- postgresql://admin:password@master.quizgame.com:5432/quizgame
```

```typescript
// backend/src/shared/database/connectionManager.ts

import { Pool } from 'pg';

// Master connection (writes)
const masterPool = new Pool({
    host: process.env.DB_MASTER_HOST,
    // ... other config
});

// Replica connection (reads)
const replicaPool = new Pool({
    host: process.env.DB_REPLICA_HOST,
    // ... other config
});

export const db = {
    query: async (text: string, params?: any[]) => {
        // Route read queries to replica
        const isReadQuery = /^SELECT/i.test(text.trim());
        const pool = isReadQuery ? replicaPool : masterPool;
        return pool.query(text, params);
    },
    master: masterPool,
    replica: replicaPool
};
```

### 4.4. Redis Cluster

```typescript
// backend/src/shared/cache/redisCluster.ts

import Redis from 'ioredis';

const cluster = new Redis.Cluster([
    {
        host: 'redis-node-1.quizgame.com',
        port: 6379
    },
    {
        host: 'redis-node-2.quizgame.com',
        port: 6379
    },
    {
        host: 'redis-node-3.quizgame.com',
        port: 6379
    }
], {
    redisOptions: {
        password: process.env.REDIS_PASSWORD
    },
    enableReadyCheck: true,
    maxRetriesPerRequest: 3
});

export { cluster as redis };
```

### 4.5. Message Queue (برای Async Operations)

```typescript
// backend/src/shared/queue/bullQueue.ts

import Bull from 'bull';
import Redis from 'ioredis';

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379')
});

// Email queue
export const emailQueue = new Bull('email', {
    redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379')
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000
        }
    }
});

// Notification queue
export const notificationQueue = new Bull('notifications', {
    redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379')
    }
});

// Process jobs
emailQueue.process(async (job) => {
    // Send email
    await sendEmail(job.data);
});

notificationQueue.process(async (job) => {
    // Send notification
    await sendNotification(job.data);
});
```

---

## 5. Monitoring & Logging

### 5.1. Logging Configuration

```typescript
// backend/src/shared/logger/logger.ts

import winston from 'winston';
import path from 'path';

const logDir = process.env.LOG_FILE 
    ? path.dirname(process.env.LOG_FILE)
    : './logs';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'quiz-game-api' },
    transports: [
        // Write all logs to file
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: parseInt(process.env.LOG_MAX_SIZE || '10485760'),
            maxFiles: parseInt(process.env.LOG_MAX_FILES || '14')
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: parseInt(process.env.LOG_MAX_SIZE || '10485760'),
            maxFiles: parseInt(process.env.LOG_MAX_FILES || '14')
        })
    ]
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

export { logger };
```

### 5.2. Error Tracking (Sentry)

```typescript
// backend/src/shared/monitoring/sentry.ts

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'production',
        integrations: [
            new ProfilingIntegration(),
        ],
        tracesSampleRate: 0.1,
        profilesSampleRate: 0.1,
    });
}

export { Sentry };
```

### 5.3. Performance Monitoring

```typescript
// backend/src/middleware/performance.ts

import { Request, Response, NextFunction } from 'express';

export function performanceMonitor(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        
        // Log slow requests
        if (duration > 1000) {
            console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
        }

        // Send to monitoring service
        if (process.env.NEW_RELIC_LICENSE_KEY) {
            // New Relic tracking
        }
    });

    next();
}
```

### 5.4. Health Check Endpoint

```typescript
// backend/src/routes/health.ts

import { Router, Request, Response } from 'express';
import { db } from '../shared/database/connection';
import { redis } from '../shared/cache/redisCache';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
            database: 'unknown',
            redis: 'unknown'
        }
    };

    // Check database
    try {
        await db.query('SELECT 1');
        health.checks.database = 'ok';
    } catch (error) {
        health.checks.database = 'error';
        health.status = 'error';
    }

    // Check Redis
    try {
        await redis.ping();
        health.checks.redis = 'ok';
    } catch (error) {
        health.checks.redis = 'error';
        health.status = 'error';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
});

export default router;
```

---

## 6. Deployment

### 6.1. Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - quiz-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=quizgame_prod
      - POSTGRES_USER=quizgame_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - quiz-network

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    restart: unless-stopped
    networks:
      - quiz-network

volumes:
  postgres-data:
  redis-data:

networks:
  quiz-network:
    driver: bridge
```

### 6.2. CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches:
      - b2

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /var/www/quizgame
            git pull origin b2
            npm ci --production
            npm run build
            pm2 restart quiz-game-api
```

### 6.3. Deployment Checklist

```markdown
# Deployment Checklist

## Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Backup created

## Deployment
- [ ] Build successful
- [ ] Docker images built
- [ ] Services started
- [ ] Health checks passing
- [ ] Database migrations applied

## Post-Deployment
- [ ] Smoke tests passing
- [ ] Monitoring alerts configured
- [ ] Logs checked
- [ ] Performance metrics reviewed
- [ ] Rollback plan ready
```

---

## 7. Backup & Recovery

### 7.1. Database Backup

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/var/backups/quizgame"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="quizgame_prod"
DB_USER="quizgame_user"

# Create backup
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Keep only last 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/db_backup_$DATE.sql.gz" s3://quizgame-backups/
```

### 7.2. Automated Backup Schedule

```bash
# Crontab entry
0 2 * * * /var/scripts/backup-database.sh
```

### 7.3. Recovery Procedure

```bash
#!/bin/bash
# restore-database.sh

BACKUP_FILE=$1
DB_NAME="quizgame_prod"
DB_USER="quizgame_user"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: restore-database.sh <backup_file>"
    exit 1
fi

# Restore
gunzip -c $BACKUP_FILE | psql -U $DB_USER -h localhost $DB_NAME
```

---

## خلاصه

این سند شامل تمام موارد لازم برای آماده‌سازی پروژه برای Production است:

1. ✅ **تنظیمات Production**: Environment variables، Build config، PM2
2. ✅ **بهینه‌سازی Performance**: Database indexes، Caching، Compression
3. ✅ **امنیت**: Security headers، Input validation، Authentication
4. ✅ **مقیاس‌پذیری**: Load balancing، Horizontal scaling، Database replication
5. ✅ **Monitoring**: Logging، Error tracking، Health checks
6. ✅ **Deployment**: Docker، CI/CD، Checklist
7. ✅ **Backup & Recovery**: Automated backups، Recovery procedures

همه موارد آماده استفاده در Production هستند.

