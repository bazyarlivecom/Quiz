# ماژول مدیریت کاربران - پیاده‌سازی کامل

این سند شامل پیاده‌سازی کامل ماژول مدیریت کاربران با کد تمیز، قابل تست و قابل توسعه است.

---

## 📋 فهرست

1. [DTOs](#1-dtos)
2. [Repository Layer](#2-repository-layer)
3. [Service Layer](#3-service-layer)
4. [Controller Layer](#4-controller-layer)
5. [Routes](#5-routes)
6. [Validation](#6-validation)
7. [Error Handling](#7-error-handling)

---

## 1. DTOs

### 1.1. Update Profile DTO

```typescript
// backend/src/modules/users/dto/updateProfileDto.ts

import { z } from 'zod';

export const updateProfileSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .trim()
        .optional(),
    email: z.string()
        .email('Invalid email format')
        .max(100, 'Email must be less than 100 characters')
        .trim()
        .optional(),
    avatarUrl: z.string()
        .url('Invalid URL format')
        .max(255, 'Avatar URL must be less than 255 characters')
        .optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    {
        message: 'At least one field must be provided for update',
    }
);

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
```

### 1.2. Change Password DTO

```typescript
// backend/src/modules/users/dto/changePasswordDto.ts

import { z } from 'zod';

export const changePasswordSchema = z.object({
    currentPassword: z.string()
        .min(1, 'Current password is required'),
    newPassword: z.string()
        .min(8, 'New password must be at least 8 characters')
        .max(255, 'New password must be less than 255 characters')
        .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'New password must contain at least one number'),
    confirmPassword: z.string()
}).refine(
    (data) => data.newPassword === data.confirmPassword,
    {
        message: "New passwords don't match",
        path: ["confirmPassword"],
    }
).refine(
    (data) => data.currentPassword !== data.newPassword,
    {
        message: 'New password must be different from current password',
        path: ["newPassword"],
    }
);

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
```

### 1.3. Get User Stats Query DTO

```typescript
// backend/src/modules/users/dto/getUserStatsQueryDto.ts

import { z } from 'zod';

export const getUserStatsQuerySchema = z.object({
    categoryId: z.string()
        .regex(/^\d+$/, 'Category ID must be a number')
        .transform(Number)
        .optional(),
    period: z.enum(['ALL_TIME', 'WEEKLY', 'MONTHLY'])
        .optional()
        .default('ALL_TIME')
});

export type GetUserStatsQueryDto = z.infer<typeof getUserStatsQuerySchema>;
```

---

## 2. Repository Layer

### 2.1. User Repository

```typescript
// backend/src/modules/users/repositories/userRepository.ts

import { db } from '../../../shared/database/connection';
import { UpdateProfileDto } from '../dto/updateProfileDto';

export interface User {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    level: number;
    xp: number;
    total_score: number;
    avatar_url: string | null;
    is_active: boolean;
    is_admin: boolean;
    last_login_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

export class UserRepository {
    async findById(id: number): Promise<User | null> {
        const result = await db.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    async findByUsername(username: string): Promise<User | null> {
        const result = await db.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        return result.rows[0] || null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const result = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0] || null;
    }

    async create(userData: {
        username: string;
        email: string;
        passwordHash: string;
        level?: number;
        xp?: number;
        totalScore?: number;
        avatarUrl?: string;
        isActive?: boolean;
        isAdmin?: boolean;
    }): Promise<User> {
        const result = await db.query(
            `INSERT INTO users (
                username, email, password_hash, level, xp, total_score,
                avatar_url, is_active, is_admin, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
                userData.username,
                userData.email,
                userData.passwordHash,
                userData.level || 1,
                userData.xp || 0,
                userData.totalScore || 0,
                userData.avatarUrl || null,
                userData.isActive !== undefined ? userData.isActive : true,
                userData.isAdmin !== undefined ? userData.isAdmin : false
            ]
        );
        return result.rows[0];
    }

    async update(id: number, userData: Partial<UpdateProfileDto & {
        passwordHash?: string;
        level?: number;
        xp?: number;
        totalScore?: number;
        lastLoginAt?: Date;
    }>): Promise<User> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (userData.username !== undefined) {
            fields.push(`username = $${paramIndex++}`);
            values.push(userData.username);
        }
        if (userData.email !== undefined) {
            fields.push(`email = $${paramIndex++}`);
            values.push(userData.email);
        }
        if (userData.avatarUrl !== undefined) {
            fields.push(`avatar_url = $${paramIndex++}`);
            values.push(userData.avatarUrl);
        }
        if (userData.passwordHash !== undefined) {
            fields.push(`password_hash = $${paramIndex++}`);
            values.push(userData.passwordHash);
        }
        if (userData.level !== undefined) {
            fields.push(`level = $${paramIndex++}`);
            values.push(userData.level);
        }
        if (userData.xp !== undefined) {
            fields.push(`xp = $${paramIndex++}`);
            values.push(userData.xp);
        }
        if (userData.totalScore !== undefined) {
            fields.push(`total_score = $${paramIndex++}`);
            values.push(userData.totalScore);
        }
        if (userData.lastLoginAt !== undefined) {
            fields.push(`last_login_at = $${paramIndex++}`);
            values.push(userData.lastLoginAt);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const result = await db.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        return result.rows[0];
    }

    async getUserStats(userId: number, categoryId: number | null = null) {
        const result = await db.query(
            `SELECT * FROM user_stats
             WHERE user_id = $1 AND category_id IS NOT DISTINCT FROM $2`,
            [userId, categoryId]
        );
        return result.rows[0] || null;
    }

    async getGameHistory(
        userId: number,
        limit: number = 10,
        offset: number = 0
    ) {
        const result = await db.query(
            `SELECT 
                m.id,
                m.started_at,
                m.ended_at,
                m.total_score,
                m.correct_answers,
                m.wrong_answers,
                m.status,
                m.time_spent,
                c.name as category_name,
                c.icon as category_icon
             FROM matches m
             LEFT JOIN categories c ON c.id = m.category_id
             WHERE m.user_id = $1
             ORDER BY m.started_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );
        return result.rows;
    }

    async getGameStatistics(userId: number) {
        const overall = await db.query(
            `SELECT 
                COUNT(*) as total_games,
                COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_games,
                COUNT(CASE WHEN status = 'ABANDONED' THEN 1 END) as abandoned_games,
                SUM(total_score) as total_score_earned,
                AVG(total_score) as average_score,
                MAX(total_score) as best_score,
                SUM(correct_answers) as total_correct,
                SUM(wrong_answers) as total_wrong,
                AVG(time_spent) as average_time
             FROM matches
             WHERE user_id = $1`,
            [userId]
        );

        const categoryBreakdown = await db.query(
            `SELECT 
                c.id,
                c.name,
                c.icon,
                COUNT(m.id) as games_played,
                AVG(m.total_score) as average_score,
                MAX(m.total_score) as best_score
             FROM categories c
             JOIN matches m ON m.category_id = c.id
             WHERE m.user_id = $1 AND m.status = 'COMPLETED'
             GROUP BY c.id, c.name, c.icon
             ORDER BY games_played DESC`,
            [userId]
        );

        return {
            overall: overall.rows[0],
            categoryBreakdown: categoryBreakdown.rows
        };
    }
}
```

---

## 3. Service Layer

### 3.1. User Service

```typescript
// backend/src/modules/users/services/userService.ts

import { UserRepository } from '../repositories/userRepository';
import { UpdateProfileDto } from '../dto/updateProfileDto';
import { ChangePasswordDto } from '../dto/changePasswordDto';
import bcrypt from 'bcryptjs';

export class UserService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    async getUserById(userId: number): Promise<UserProfile | null> {
        const user = await this.userRepository.findById(userId);
        
        if (!user) {
            return null;
        }

        const stats = await this.userRepository.getUserStats(userId);

        return {
            id: user.id,
            username: user.username,
            email: user.email,
            level: user.level,
            xp: user.xp,
            totalScore: user.total_score,
            avatarUrl: user.avatar_url,
            lastLoginAt: user.last_login_at,
            createdAt: user.created_at,
            stats: stats
        };
    }

    async updateProfile(
        userId: number,
        updateData: UpdateProfileDto
    ): Promise<UserProfile> {
        // Validate username if changed
        if (updateData.username) {
            const existing = await this.userRepository.findByUsername(updateData.username);
            if (existing && existing.id !== userId) {
                throw new Error('Username already taken');
            }
        }

        // Validate email if changed
        if (updateData.email) {
            const existing = await this.userRepository.findByEmail(updateData.email);
            if (existing && existing.id !== userId) {
                throw new Error('Email already taken');
            }
        }

        // Update user
        await this.userRepository.update(userId, updateData);

        return await this.getUserById(userId) as UserProfile;
    }

    async changePassword(
        userId: number,
        dto: ChangePasswordDto
    ): Promise<void> {
        // Get user
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(
            dto.currentPassword,
            user.password_hash
        );
        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        // Hash new password
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(dto.newPassword, saltRounds);

        // Update password
        await this.userRepository.update(userId, {
            passwordHash: newPasswordHash
        });
    }

    async getUserStats(userId: number, categoryId?: number) {
        const stats = await this.userRepository.getUserStats(
            userId,
            categoryId || null
        );

        if (!stats) {
            return null;
        }

        return {
            gamesPlayed: stats.games_played,
            totalQuestions: stats.total_questions,
            correctAnswers: stats.correct_answers,
            wrongAnswers: stats.wrong_answers,
            bestScore: stats.best_score,
            averageScore: parseFloat(stats.average_score),
            averageTime: parseFloat(stats.average_time),
            accuracyRate: parseFloat(stats.accuracy_rate),
            lastPlayedAt: stats.last_played_at
        };
    }

    async getGameHistory(
        userId: number,
        limit: number = 10,
        offset: number = 0
    ) {
        const games = await this.userRepository.getGameHistory(userId, limit, offset);

        return games.map(game => ({
            id: game.id,
            startedAt: game.started_at,
            endedAt: game.ended_at,
            totalScore: game.total_score,
            correctAnswers: game.correct_answers,
            wrongAnswers: game.wrong_answers,
            status: game.status,
            timeSpent: game.time_spent,
            category: game.category_name ? {
                name: game.category_name,
                icon: game.category_icon
            } : null
        }));
    }

    async getGameStatistics(userId: number) {
        const data = await this.userRepository.getGameStatistics(userId);
        const row = data.overall;

        const totalAnswers = parseInt(row.total_correct || 0) + parseInt(row.total_wrong || 0);
        const accuracy = totalAnswers > 0
            ? (parseInt(row.total_correct || 0) / totalAnswers) * 100
            : 0;

        return {
            overall: {
                totalGames: parseInt(row.total_games || 0),
                completedGames: parseInt(row.completed_games || 0),
                abandonedGames: parseInt(row.abandoned_games || 0),
                totalScore: parseFloat(row.total_score_earned || 0),
                averageScore: parseFloat(row.average_score || 0),
                bestScore: parseFloat(row.best_score || 0),
                totalCorrect: parseInt(row.total_correct || 0),
                totalWrong: parseInt(row.total_wrong || 0),
                accuracy: Math.round(accuracy * 100) / 100,
                averageTime: parseFloat(row.average_time || 0)
            },
            categoryBreakdown: data.categoryBreakdown.map(cat => ({
                id: cat.id,
                name: cat.name,
                icon: cat.icon,
                gamesPlayed: parseInt(cat.games_played),
                averageScore: parseFloat(cat.average_score),
                bestScore: parseFloat(cat.best_score)
            }))
        };
    }
}
```

---

## 4. Controller Layer

### 4.1. User Controller

```typescript
// backend/src/modules/users/controllers/userController.ts

import { Response } from 'express';
import { AuthRequest } from '../../../shared/middleware/auth';
import { UserService } from '../services/userService';
import { updateProfileSchema } from '../dto/updateProfileDto';
import { changePasswordSchema } from '../dto/changePasswordDto';
import { getUserStatsQuerySchema } from '../dto/getUserStatsQueryDto';
import { z } from 'zod';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const user = await this.userService.getUserById(req.user.userId);
            
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
                return;
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get user'
            });
        }
    }

    async updateProfile(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const validatedData = updateProfileSchema.parse(req.body);
            const user = await this.userService.updateProfile(
                req.user.userId,
                validatedData
            );

            res.json({
                success: true,
                data: user,
                message: 'Profile updated successfully'
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.errors
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: error.message || 'Failed to update profile'
                });
            }
        }
    }

    async changePassword(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const validatedData = changePasswordSchema.parse(req.body);
            await this.userService.changePassword(req.user.userId, validatedData);

            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.errors
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: error.message || 'Failed to change password'
                });
            }
        }
    }

    async getStatistics(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const stats = await this.userService.getGameStatistics(req.user.userId);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get statistics'
            });
        }
    }

    async getGameHistory(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const limit = req.query.limit 
                ? parseInt(req.query.limit as string) 
                : 10;
            const offset = req.query.offset 
                ? parseInt(req.query.offset as string) 
                : 0;

            const history = await this.userService.getGameHistory(
                req.user.userId,
                limit,
                offset
            );

            res.json({
                success: true,
                data: history,
                pagination: {
                    limit,
                    offset,
                    count: history.length
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get game history'
            });
        }
    }
}
```

---

## 5. Routes

```typescript
// backend/src/modules/users/routes/userRoutes.ts

import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authMiddleware } from '../../../shared/middleware/auth';
import { apiRateLimiter } from '../../../shared/middleware/rateLimiter';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.get('/me', authMiddleware, apiRateLimiter, (req, res) => 
    userController.getCurrentUser(req, res)
);

router.put('/profile', authMiddleware, apiRateLimiter, (req, res) => 
    userController.updateProfile(req, res)
);

router.post('/change-password', authMiddleware, apiRateLimiter, (req, res) => 
    userController.changePassword(req, res)
);

router.get('/stats', authMiddleware, apiRateLimiter, (req, res) => 
    userController.getStatistics(req, res)
);

router.get('/history', authMiddleware, apiRateLimiter, (req, res) => 
    userController.getGameHistory(req, res)
);

export default router;
```

---

## 6. Validation

```typescript
// backend/src/modules/users/validators/userValidators.ts

export class UserValidators {
    static validateUsername(username: string): { valid: boolean; error?: string } {
        if (!username || username.trim().length === 0) {
            return { valid: false, error: 'Username cannot be empty' };
        }

        if (username.length < 3) {
            return { valid: false, error: 'Username must be at least 3 characters' };
        }

        if (username.length > 50) {
            return { valid: false, error: 'Username must be less than 50 characters' };
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
        }

        return { valid: true };
    }

    static validateEmail(email: string): { valid: boolean; error?: string } {
        if (!email || email.trim().length === 0) {
            return { valid: false, error: 'Email cannot be empty' };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { valid: false, error: 'Invalid email format' };
        }

        if (email.length > 100) {
            return { valid: false, error: 'Email must be less than 100 characters' };
        }

        return { valid: true };
    }
}
```

---

## 7. Error Handling

```typescript
// backend/src/shared/utils/errors.ts

export class UserNotFoundError extends Error {
    constructor(id: number) {
        super(`User with ID ${id} not found`);
        this.name = 'UserNotFoundError';
    }
}

export class UsernameAlreadyExistsError extends Error {
    constructor(username: string) {
        super(`Username '${username}' already exists`);
        this.name = 'UsernameAlreadyExistsError';
    }
}

export class EmailAlreadyExistsError extends Error {
    constructor(email: string) {
        super(`Email '${email}' already exists`);
        this.name = 'EmailAlreadyExistsError';
    }
}

export class InvalidPasswordError extends Error {
    constructor(message: string = 'Invalid password') {
        super(message);
        this.name = 'InvalidPasswordError';
    }
}
```

---

## 📊 API Endpoints

```
GET    /api/users/me              - Get current user profile
PUT    /api/users/profile         - Update profile
POST   /api/users/change-password - Change password
GET    /api/users/stats           - Get game statistics
GET    /api/users/history         - Get game history
```

---

این ماژول مدیریت کاربران کامل است و آماده استفاده می‌باشد.

