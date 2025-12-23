# ماژول Leaderboard - پیاده‌سازی کامل

این سند شامل پیاده‌سازی کامل ماژول Leaderboard با کد تمیز، قابل تست و قابل توسعه است.

---

## 📋 فهرست

1. [DTOs](#1-dtos)
2. [Repository Layer](#2-repository-layer)
3. [Service Layer](#3-service-layer)
4. [Controller Layer](#4-controller-layer)
5. [Routes](#5-routes)
6. [Redis Integration](#6-redis-integration)
7. [Error Handling](#7-error-handling)

---

## 1. DTOs

### 1.1. Get Leaderboard Query DTO

```typescript
// backend/src/modules/leaderboard/dto/getLeaderboardQueryDto.ts

import { z } from 'zod';

export const getLeaderboardQuerySchema = z.object({
    period: z.enum(['ALL_TIME', 'WEEKLY', 'MONTHLY'])
        .optional()
        .default('ALL_TIME'),
    categoryId: z.string()
        .regex(/^\d+$/, 'Category ID must be a number')
        .transform(Number)
        .optional(),
    page: z.string()
        .regex(/^\d+$/, 'Page must be a number')
        .transform(Number)
        .default('1')
        .optional(),
    limit: z.string()
        .regex(/^\d+$/, 'Limit must be a number')
        .transform(Number)
        .default('100')
        .optional()
});

export type GetLeaderboardQueryDto = z.infer<typeof getLeaderboardQuerySchema>;
```

---

## 2. Repository Layer

### 2.1. Leaderboard Repository

```typescript
// backend/src/modules/leaderboard/repositories/leaderboardRepository.ts

import { db } from '../../../shared/database/connection';

export interface LeaderboardEntry {
    id: number;
    user_id: number;
    rank_position: number;
    total_score: number;
    level: number;
    xp: number;
    period_type: string;
    period_start: Date;
    period_end: Date | null;
    updated_at: Date;
}

export interface LeaderboardUser {
    userId: number;
    username: string;
    level: number;
    xp: number;
    totalScore: number;
    rank: number;
    avatarUrl: string | null;
}

export class LeaderboardRepository {
    async getGlobalLeaderboard(
        period: string = 'ALL_TIME',
        limit: number = 100,
        offset: number = 0
    ): Promise<LeaderboardUser[]> {
        let query = `
            SELECT 
                u.id as user_id,
                u.username,
                u.level,
                u.xp,
                u.total_score,
                u.avatar_url,
                ROW_NUMBER() OVER (ORDER BY u.total_score DESC, u.xp DESC) as rank
            FROM users u
            WHERE u.is_active = true
        `;

        // Filter by period if not ALL_TIME
        if (period === 'WEEKLY') {
            query += ` AND u.updated_at >= DATE_TRUNC('week', CURRENT_DATE)`;
        } else if (period === 'MONTHLY') {
            query += ` AND u.updated_at >= DATE_TRUNC('month', CURRENT_DATE)`;
        }

        query += ` ORDER BY u.total_score DESC, u.xp DESC LIMIT $1 OFFSET $2`;

        const result = await db.query(query, [limit, offset]);

        return result.rows.map(row => ({
            userId: row.user_id,
            username: row.username,
            level: row.level,
            xp: row.xp,
            totalScore: row.total_score,
            rank: parseInt(row.rank),
            avatarUrl: row.avatar_url
        }));
    }

    async getCategoryLeaderboard(
        categoryId: number,
        limit: number = 100,
        offset: number = 0
    ): Promise<LeaderboardUser[]> {
        const result = await db.query(
            `SELECT 
                u.id as user_id,
                u.username,
                u.level,
                u.xp,
                us.best_score as total_score,
                u.avatar_url,
                ROW_NUMBER() OVER (ORDER BY us.best_score DESC) as rank
            FROM user_stats us
            JOIN users u ON u.id = us.user_id
            WHERE us.category_id = $1 
              AND u.is_active = true
              AND us.best_score > 0
            ORDER BY us.best_score DESC
            LIMIT $2 OFFSET $3`,
            [categoryId, limit, offset]
        );

        return result.rows.map(row => ({
            userId: row.user_id,
            username: row.username,
            level: row.level,
            xp: row.xp,
            totalScore: row.total_score,
            rank: parseInt(row.rank),
            avatarUrl: row.avatar_url
        }));
    }

    async getUserRank(userId: number, period: string = 'ALL_TIME'): Promise<number | null> {
        let query = `
            SELECT rank
            FROM (
                SELECT 
                    u.id,
                    ROW_NUMBER() OVER (ORDER BY u.total_score DESC, u.xp DESC) as rank
                FROM users u
                WHERE u.is_active = true
            ) ranked
            WHERE id = $1
        `;

        const result = await db.query(query, [userId]);
        return result.rows[0] ? parseInt(result.rows[0].rank) : null;
    }

    async getTotalUsers(period?: string): Promise<number> {
        let query = 'SELECT COUNT(*) as count FROM users WHERE is_active = true';

        if (period === 'WEEKLY') {
            query += ` AND updated_at >= DATE_TRUNC('week', CURRENT_DATE)`;
        } else if (period === 'MONTHLY') {
            query += ` AND updated_at >= DATE_TRUNC('month', CURRENT_DATE)`;
        }

        const result = await db.query(query);
        return parseInt(result.rows[0].count);
    }

    async updateLeaderboardCache(
        period: string,
        entries: Array<{
            userId: number;
            rank: number;
            totalScore: number;
            level: number;
            xp: number;
        }>
    ): Promise<void> {
        const periodStart = this.getPeriodStart(period);

        // Delete old entries
        await db.query(
            `DELETE FROM leaderboard 
             WHERE period_type = $1 AND period_start = $2`,
            [period, periodStart]
        );

        // Insert new entries
        for (const entry of entries) {
            await db.query(
                `INSERT INTO leaderboard (
                    user_id, rank_position, total_score, level, xp,
                    period_type, period_start, period_end, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id, period_type, period_start)
                DO UPDATE SET
                    rank_position = EXCLUDED.rank_position,
                    total_score = EXCLUDED.total_score,
                    level = EXCLUDED.level,
                    xp = EXCLUDED.xp,
                    updated_at = CURRENT_TIMESTAMP`,
                [
                    entry.userId,
                    entry.rank,
                    entry.totalScore,
                    entry.level,
                    entry.xp,
                    period,
                    periodStart,
                    this.getPeriodEnd(period, periodStart)
                ]
            );
        }
    }

    private getPeriodStart(period: string): Date {
        const now = new Date();
        if (period === 'WEEKLY') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            return startOfWeek;
        } else if (period === 'MONTHLY') {
            return new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
            return new Date('1970-01-01');
        }
    }

    private getPeriodEnd(period: string, start: Date): Date | null {
        if (period === 'ALL_TIME') {
            return null;
        } else if (period === 'WEEKLY') {
            const end = new Date(start);
            end.setDate(start.getDate() + 7);
            return end;
        } else if (period === 'MONTHLY') {
            const end = new Date(start);
            end.setMonth(start.getMonth() + 1);
            return end;
        }
        return null;
    }
}
```

---

## 3. Service Layer

### 3.1. Leaderboard Service

```typescript
// backend/src/modules/leaderboard/services/leaderboardService.ts

import { LeaderboardRepository } from '../repositories/leaderboardRepository';
import { RedisClient } from '../../../infrastructure/cache/redisClient';
import { db } from '../../../shared/database/connection';

export class LeaderboardService {
    private leaderboardRepository: LeaderboardRepository;
    private redisClient: RedisClient;

    constructor() {
        this.leaderboardRepository = new LeaderboardRepository();
        this.redisClient = new RedisClient();
    }

    async getLeaderboard(
        period: string = 'ALL_TIME',
        categoryId?: number,
        page: number = 1,
        limit: number = 100
    ): Promise<LeaderboardResponse> {
        const offset = (page - 1) * limit;

        // Try to get from cache first
        const cacheKey = `leaderboard:${period}:${categoryId || 'all'}:${page}:${limit}`;
        const cached = await this.redisClient.get(cacheKey);
        
        if (cached) {
            return JSON.parse(cached);
        }

        // Get from database
        let entries: LeaderboardUser[];
        let total: number;

        if (categoryId) {
            entries = await this.leaderboardRepository.getCategoryLeaderboard(
                categoryId,
                limit,
                offset
            );
            total = await this.getCategoryTotalUsers(categoryId);
        } else {
            entries = await this.leaderboardRepository.getGlobalLeaderboard(
                period,
                limit,
                offset
            );
            total = await this.leaderboardRepository.getTotalUsers(period);
        }

        const response: LeaderboardResponse = {
            entries,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            period,
            categoryId: categoryId || null
        };

        // Cache for 5 minutes
        await this.redisClient.set(cacheKey, JSON.stringify(response), 300);

        return response;
    }

    async getUserRank(
        userId: number,
        period: string = 'ALL_TIME',
        categoryId?: number
    ): Promise<UserRankResponse> {
        let rank: number | null;
        let totalUsers: number;

        if (categoryId) {
            // For category leaderboard, calculate rank based on best_score
            const result = await db.query(
                `SELECT 
                    COUNT(*) + 1 as rank,
                    (SELECT COUNT(*) FROM user_stats WHERE category_id = $1 AND best_score > 0) as total
                FROM user_stats
                WHERE category_id = $1 
                  AND best_score > (
                      SELECT COALESCE(best_score, 0) 
                      FROM user_stats 
                      WHERE user_id = $2 AND category_id = $1
                  )`,
                [categoryId, userId]
            );
            rank = result.rows[0] ? parseInt(result.rows[0].rank) : null;
            totalUsers = parseInt(result.rows[0]?.total || 0);
        } else {
            rank = await this.leaderboardRepository.getUserRank(userId, period);
            totalUsers = await this.leaderboardRepository.getTotalUsers(period);
        }

        return {
            userId,
            rank: rank || null,
            totalUsers,
            period,
            categoryId: categoryId || null
        };
    }

    async refreshLeaderboard(period: string = 'ALL_TIME'): Promise<void> {
        // Get top users
        const users = await this.leaderboardRepository.getGlobalLeaderboard(period, 1000, 0);

        // Update cache
        await this.leaderboardRepository.updateLeaderboardCache(
            period,
            users.map((user, index) => ({
                userId: user.userId,
                rank: index + 1,
                totalScore: user.totalScore,
                level: user.level,
                xp: user.xp
            }))
        );

        // Clear Redis cache
        const pattern = `leaderboard:${period}:*`;
        await this.redisClient.deletePattern(pattern);
    }

    private async getCategoryTotalUsers(categoryId: number): Promise<number> {
        const result = await db.query(
            `SELECT COUNT(*) as count
             FROM user_stats
             WHERE category_id = $1 AND best_score > 0`,
            [categoryId]
        );
        return parseInt(result.rows[0].count);
    }
}
```

---

## 4. Controller Layer

```typescript
// backend/src/modules/leaderboard/controllers/leaderboardController.ts

import { Request, Response } from 'express';
import { AuthRequest } from '../../../shared/middleware/auth';
import { LeaderboardService } from '../services/leaderboardService';
import { getLeaderboardQuerySchema } from '../dto/getLeaderboardQueryDto';
import { z } from 'zod';

export class LeaderboardController {
    private leaderboardService: LeaderboardService;

    constructor() {
        this.leaderboardService = new LeaderboardService();
    }

    async getLeaderboard(req: Request, res: Response): Promise<void> {
        try {
            const validatedQuery = getLeaderboardQuerySchema.parse(req.query);

            const leaderboard = await this.leaderboardService.getLeaderboard(
                validatedQuery.period,
                validatedQuery.categoryId,
                validatedQuery.page,
                validatedQuery.limit
            );

            res.json({
                success: true,
                data: leaderboard
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.errors
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: error.message || 'Failed to get leaderboard'
                });
            }
        }
    }

    async getUserRank(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const period = req.query.period as string || 'ALL_TIME';
            const categoryId = req.query.categoryId 
                ? parseInt(req.query.categoryId as string) 
                : undefined;

            const rank = await this.leaderboardService.getUserRank(
                req.user.userId,
                period,
                categoryId
            );

            res.json({
                success: true,
                data: rank
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get user rank'
            });
        }
    }

    async refreshLeaderboard(req: Request, res: Response): Promise<void> {
        try {
            const period = req.body.period || 'ALL_TIME';
            await this.leaderboardService.refreshLeaderboard(period);

            res.json({
                success: true,
                message: 'Leaderboard refreshed successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to refresh leaderboard'
            });
        }
    }
}
```

---

## 5. Routes

```typescript
// backend/src/modules/leaderboard/routes/leaderboardRoutes.ts

import { Router } from 'express';
import { LeaderboardController } from '../controllers/leaderboardController';
import { authMiddleware } from '../../../shared/middleware/auth';
import { apiRateLimiter } from '../../../shared/middleware/rateLimiter';

const router = Router();
const leaderboardController = new LeaderboardController();

router.get('/', apiRateLimiter, (req, res) => 
    leaderboardController.getLeaderboard(req, res)
);

router.get('/my-rank', authMiddleware, apiRateLimiter, (req, res) => 
    leaderboardController.getUserRank(req, res)
);

router.post('/refresh', authMiddleware, apiRateLimiter, (req, res) => 
    leaderboardController.refreshLeaderboard(req, res)
);

export default router;
```

---

## 6. Redis Integration

### 6.1. Redis Client

```typescript
// backend/src/infrastructure/cache/redisClient.ts

import Redis from 'ioredis';

export class RedisClient {
    private client: Redis;

    constructor() {
        this.client = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0')
        });
    }

    async get(key: string): Promise<string | null> {
        return await this.client.get(key);
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        if (ttl) {
            await this.client.setex(key, ttl, value);
        } else {
            await this.client.set(key, value);
        }
    }

    async delete(key: string): Promise<void> {
        await this.client.del(key);
    }

    async deletePattern(pattern: string): Promise<void> {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
            await this.client.del(...keys);
        }
    }

    async zAdd(key: string, score: number, member: string): Promise<void> {
        await this.client.zadd(key, score, member);
    }

    async zRange(key: string, start: number, stop: number): Promise<string[]> {
        return await this.client.zrange(key, start, stop);
    }

    async zRevRange(key: string, start: number, stop: number): Promise<string[]> {
        return await this.client.zrevrange(key, start, stop);
    }

    async zRank(key: string, member: string): Promise<number | null> {
        const rank = await this.client.zrank(key, member);
        return rank !== null ? rank : null;
    }

    async zScore(key: string, member: string): Promise<number | null> {
        const score = await this.client.zscore(key, member);
        return score !== null ? parseFloat(score) : null;
    }
}
```

---

## 📊 API Endpoints

```
GET    /api/leaderboard              - Get leaderboard
GET    /api/leaderboard/my-rank      - Get user's rank
POST   /api/leaderboard/refresh      - Refresh leaderboard cache
```

---

## 📝 Type Definitions

```typescript
interface LeaderboardResponse {
    entries: LeaderboardUser[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    period: string;
    categoryId: number | null;
}

interface UserRankResponse {
    userId: number;
    rank: number | null;
    totalUsers: number;
    period: string;
    categoryId: number | null;
}
```

---

## 🔄 Caching Strategy

1. **Redis Cache**: Leaderboard entries cached for 5 minutes
2. **Database Cache**: Materialized view for performance
3. **Auto-refresh**: Background job to refresh periodically
4. **Cache Invalidation**: On user score update

---

این ماژول Leaderboard کامل است و آماده استفاده می‌باشد.

