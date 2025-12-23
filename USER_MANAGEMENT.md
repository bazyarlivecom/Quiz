# سیستم مدیریت کاربران - پیاده‌سازی کامل

این سند شامل پیاده‌سازی کامل سیستم مدیریت کاربران با امنیت پایه است.

---

## 📋 فهرست

1. [ثبت‌نام (Registration)](#1-ثبت‌نام-registration)
2. [ورود (Login)](#2-ورود-login)
3. [احراز هویت (Authentication)](#3-احراز-هویت-authentication)
4. [پروفایل کاربر](#4-پروفایل-کاربر)
5. [مدیریت Level و XP](#5-مدیریت-level-و-xp)
6. [آمار بازی‌ها](#6-آمار-بازی‌ها)
7. [امنیت](#7-امنیت)

---

## 1. ثبت‌نام (Registration)

### 1.1. DTO (Data Transfer Object)

```typescript
// backend/src/modules/auth/dto/registerDto.ts

import { z } from 'zod';

export const registerSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string()
        .email('Invalid email format')
        .max(100, 'Email must be less than 100 characters'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(255, 'Password must be less than 255 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export type RegisterDto = z.infer<typeof registerSchema>;
```

### 1.2. Service Layer

```typescript
// backend/src/modules/auth/services/authService.ts

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../../shared/database/connection';
import { RegisterDto } from '../dto/registerDto';
import { LoginDto } from '../dto/loginDto';
import { UserRepository } from '../../users/repositories/userRepository';
import { ProgressService } from '../../progress/services/progressService';

export class AuthService {
    private userRepository: UserRepository;
    private progressService: ProgressService;
    private readonly JWT_SECRET: string;
    private readonly JWT_EXPIRES_IN: string = '15m';
    private readonly REFRESH_TOKEN_EXPIRES_IN: string = '7d';

    constructor() {
        this.userRepository = new UserRepository();
        this.progressService = new ProgressService();
        this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    }

    async register(dto: RegisterDto): Promise<AuthResponse> {
        // 1. Check if username exists
        const existingUserByUsername = await this.userRepository.findByUsername(dto.username);
        if (existingUserByUsername) {
            throw new Error('Username already exists');
        }

        // 2. Check if email exists
        const existingUserByEmail = await this.userRepository.findByEmail(dto.email);
        if (existingUserByEmail) {
            throw new Error('Email already exists');
        }

        // 3. Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(dto.password, saltRounds);

        // 4. Create user
        const user = await this.userRepository.create({
            username: dto.username,
            email: dto.email,
            passwordHash: passwordHash,
            level: 1,
            xp: 0,
            totalScore: 0,
            isActive: true,
            isAdmin: false
        });

        // 5. Initialize user stats
        await this.progressService.initializeUserStats(user.id);

        // 6. Generate tokens
        const tokens = this.generateTokens(user.id, user.username);

        // 7. Return response (without password hash)
        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                level: user.level,
                xp: user.xp,
                totalScore: user.totalScore,
                avatarUrl: user.avatarUrl
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        };
    }

    private generateTokens(userId: number, username: string): TokenPair {
        const payload = {
            userId,
            username,
            type: 'access'
        };

        const accessToken = jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: this.JWT_EXPIRES_IN
        });

        const refreshPayload = {
            userId,
            username,
            type: 'refresh'
        };

        const refreshToken = jwt.sign(refreshPayload, this.JWT_SECRET, {
            expiresIn: this.REFRESH_TOKEN_EXPIRES_IN
        });

        return { accessToken, refreshToken };
    }
}
```

### 1.3. Repository Layer

```typescript
// backend/src/modules/users/repositories/userRepository.ts

import { db } from '../../../shared/database/connection';

export class UserRepository {
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

    async findById(id: number): Promise<User | null> {
        const result = await db.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    async create(userData: CreateUserData): Promise<User> {
        const result = await db.query(
            `INSERT INTO users (
                username, email, password_hash, level, xp, 
                total_score, is_active, is_admin, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
                userData.username,
                userData.email,
                userData.passwordHash,
                userData.level || 1,
                userData.xp || 0,
                userData.totalScore || 0,
                userData.isActive !== undefined ? userData.isActive : true,
                userData.isAdmin !== undefined ? userData.isAdmin : false
            ]
        );
        return result.rows[0];
    }

    async update(id: number, userData: Partial<User>): Promise<User> {
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

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const result = await db.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        return result.rows[0];
    }
}
```

### 1.4. Controller

```typescript
// backend/src/modules/auth/controllers/authController.ts

import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { registerSchema } from '../dto/registerDto';
import { loginSchema } from '../dto/loginDto';

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    async register(req: Request, res: Response): Promise<void> {
        try {
            // Validate input
            const validatedData = registerSchema.parse(req.body);

            // Register user
            const result = await this.authService.register(validatedData);

            res.status(201).json({
                success: true,
                data: result,
                message: 'User registered successfully'
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
                    error: error.message || 'Registration failed'
                });
            }
        }
    }
}
```

---

## 2. ورود (Login)

### 2.1. Login DTO

```typescript
// backend/src/modules/auth/dto/loginDto.ts

import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
});

export type LoginDto = z.infer<typeof loginSchema>;
```

### 2.2. Login Service

```typescript
// backend/src/modules/auth/services/authService.ts (continued)

async login(dto: LoginDto): Promise<AuthResponse> {
    // 1. Find user by email
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
        throw new Error('Invalid email or password');
    }

    // 2. Check if user is active
    if (!user.is_active) {
        throw new Error('Account is deactivated');
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
        throw new Error('Invalid email or password');
    }

    // 4. Update last login
    await this.userRepository.update(user.id, {
        lastLoginAt: new Date()
    });

    // 5. Generate tokens
    const tokens = this.generateTokens(user.id, user.username);

    // 6. Return response
    return {
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            level: user.level,
            xp: user.xp,
            totalScore: user.totalScore,
            avatarUrl: user.avatarUrl
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
    };
}

async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as any;
        
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }

        // Get user
        const user = await this.userRepository.findById(decoded.userId);
        if (!user || !user.is_active) {
            throw new Error('User not found or inactive');
        }

        // Generate new tokens
        return this.generateTokens(user.id, user.username);
    } catch (error) {
        throw new Error('Invalid refresh token');
    }
}
```

### 2.3. Login Controller

```typescript
// backend/src/modules/auth/controllers/authController.ts (continued)

async login(req: Request, res: Response): Promise<void> {
    try {
        const validatedData = loginSchema.parse(req.body);
        const result = await this.authService.login(validatedData);

        res.json({
            success: true,
            data: result,
            message: 'Login successful'
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        } else {
            res.status(401).json({
                success: false,
                error: error.message || 'Login failed'
            });
        }
    }
}

async refreshToken(req: Request, res: Response): Promise<void> {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            res.status(400).json({
                success: false,
                error: 'Refresh token is required'
            });
            return;
        }

        const tokens = await this.authService.refreshToken(refreshToken);

        res.json({
            success: true,
            data: tokens,
            message: 'Token refreshed successfully'
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            error: error.message || 'Token refresh failed'
        });
    }
}
```

---

## 3. احراز هویت (Authentication)

### 3.1. Authentication Middleware

```typescript
// backend/src/shared/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: {
        userId: number;
        username: string;
    };
}

export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'No token provided'
            });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        // Check token type
        if (decoded.type !== 'access') {
            res.status(401).json({
                success: false,
                error: 'Invalid token type'
            });
            return;
        }

        // Attach user to request
        req.user = {
            userId: decoded.userId,
            username: decoded.username
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: 'Token expired'
            });
        } else if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Authentication failed'
            });
        }
    }
};
```

### 3.2. Get Current User

```typescript
// backend/src/modules/users/controllers/userController.ts

import { AuthRequest, Response } from 'express';
import { UserService } from '../services/userService';

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
}
```

---

## 4. پروفایل کاربر

### 4.1. User Service

```typescript
// backend/src/modules/users/services/userService.ts

import { UserRepository } from '../repositories/userRepository';
import { ProgressService } from '../../progress/services/progressService';

export class UserService {
    private userRepository: UserRepository;
    private progressService: ProgressService;

    constructor() {
        this.userRepository = new UserRepository();
        this.progressService = new ProgressService();
    }

    async getUserById(userId: number): Promise<UserProfile | null> {
        const user = await this.userRepository.findById(userId);
        
        if (!user) {
            return null;
        }

        // Get user stats
        const stats = await this.progressService.getUserStats(userId);

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
        const updatedUser = await this.userRepository.update(userId, {
            username: updateData.username,
            email: updateData.email,
            avatarUrl: updateData.avatarUrl
        });

        return this.getUserById(userId) as Promise<UserProfile>;
    }

    async changePassword(
        userId: number,
        currentPassword: string,
        newPassword: string
    ): Promise<void> {
        // Get user
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password_hash
        );
        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        // Validate new password
        if (newPassword.length < 8) {
            throw new Error('New password must be at least 8 characters');
        }

        // Hash new password
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await this.userRepository.update(userId, {
            passwordHash: newPasswordHash
        });
    }
}
```

### 4.2. Update Profile DTO

```typescript
// backend/src/modules/users/dto/updateProfileDto.ts

import { z } from 'zod';

export const updateProfileSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .optional(),
    email: z.string()
        .email('Invalid email format')
        .max(100, 'Email must be less than 100 characters')
        .optional(),
    avatarUrl: z.string()
        .url('Invalid URL format')
        .max(255, 'Avatar URL must be less than 255 characters')
        .optional()
}).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
```

---

## 5. مدیریت Level و XP

### 5.1. Progress Service

```typescript
// backend/src/modules/progress/services/progressService.ts

import { db } from '../../../shared/database/connection';
import { UserRepository } from '../../users/repositories/userRepository';

export class ProgressService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    async addXP(userId: number, xpAmount: number): Promise<LevelUpResult> {
        // Get current user
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const oldLevel = user.level;
        const oldXP = user.xp;

        // Add XP
        const newXP = oldXP + xpAmount;

        // Calculate new level
        const newLevel = this.calculateLevel(newXP);

        // Update user
        await this.userRepository.update(userId, {
            xp: newXP,
            level: newLevel
        });

        // Check if leveled up
        const leveledUp = newLevel > oldLevel;

        return {
            oldLevel,
            newLevel,
            oldXP,
            newXP,
            xpGained: xpAmount,
            leveledUp,
            xpForNextLevel: this.getXPForLevel(newLevel + 1)
        };
    }

    calculateLevel(xp: number): number {
        // Formula: level = floor(sqrt(xp / 100)) + 1
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    }

    getXPForLevel(level: number): number {
        // Formula: (level - 1)² × 100
        return Math.pow(level - 1, 2) * 100;
    }

    getXPProgress(userId: number): XPProgress {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const currentLevelXP = this.getXPForLevel(user.level);
        const nextLevelXP = this.getXPForLevel(user.level + 1);
        const xpInCurrentLevel = user.xp - currentLevelXP;
        const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
        const progress = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

        return {
            currentLevel: user.level,
            currentXP: user.xp,
            xpInCurrentLevel,
            xpNeededForNextLevel,
            progress: Math.min(100, Math.max(0, progress)),
            nextLevelXP
        };
    }

    async initializeUserStats(userId: number): Promise<void> {
        // Create overall stats (category_id = NULL)
        await db.query(
            `INSERT INTO user_stats (
                user_id, category_id, games_played, total_questions,
                correct_answers, wrong_answers, best_score, average_score,
                accuracy_rate, created_at, updated_at
            ) VALUES ($1, NULL, 0, 0, 0, 0, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, category_id) DO NOTHING`,
            [userId]
        );
    }

    async getUserStats(userId: number): Promise<UserStats> {
        // Get overall stats
        const overallStats = await db.query(
            `SELECT * FROM user_stats
             WHERE user_id = $1 AND category_id IS NULL`,
            [userId]
        );

        // Get category stats
        const categoryStats = await db.query(
            `SELECT us.*, c.name as category_name, c.icon as category_icon
             FROM user_stats us
             JOIN categories c ON c.id = us.category_id
             WHERE us.user_id = $1
             ORDER BY us.best_score DESC`,
            [userId]
        );

        return {
            overall: overallStats.rows[0] || null,
            byCategory: categoryStats.rows
        };
    }

    async updateUserStats(
        userId: number,
        categoryId: number | null,
        stats: FinalStats
    ): Promise<void> {
        // Get or create stats record
        let userStats = await db.query(
            `SELECT * FROM user_stats
             WHERE user_id = $1 AND category_id IS NOT DISTINCT FROM $2`,
            [userId, categoryId]
        );

        if (userStats.rows.length === 0) {
            // Create new stats
            await db.query(
                `INSERT INTO user_stats (
                    user_id, category_id, games_played, total_questions,
                    correct_answers, wrong_answers, best_score, average_score,
                    accuracy_rate, created_at, updated_at
                ) VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [
                    userId,
                    categoryId,
                    stats.correctAnswers + stats.wrongAnswers,
                    stats.correctAnswers,
                    stats.wrongAnswers,
                    stats.totalScore,
                    stats.totalScore,
                    stats.accuracy
                ]
            );
        } else {
            // Update existing stats
            const existing = userStats.rows[0];
            const newGamesPlayed = existing.games_played + 1;
            const newTotalQuestions = existing.total_questions + stats.correctAnswers + stats.wrongAnswers;
            const newCorrectAnswers = existing.correct_answers + stats.correctAnswers;
            const newWrongAnswers = existing.wrong_answers + stats.wrongAnswers;
            const newBestScore = Math.max(existing.best_score, stats.totalScore);
            const newAverageScore = (
                (existing.average_score * existing.games_played) + stats.totalScore
            ) / newGamesPlayed;
            const newAccuracy = (newCorrectAnswers / newTotalQuestions) * 100;

            await db.query(
                `UPDATE user_stats
                 SET 
                    games_played = $1,
                    total_questions = $2,
                    correct_answers = $3,
                    wrong_answers = $4,
                    best_score = $5,
                    average_score = $6,
                    accuracy_rate = $7,
                    last_played_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $8 AND category_id IS NOT DISTINCT FROM $9`,
                [
                    newGamesPlayed,
                    newTotalQuestions,
                    newCorrectAnswers,
                    newWrongAnswers,
                    newBestScore,
                    newAverageScore,
                    newAccuracy,
                    userId,
                    categoryId
                ]
            );
        }
    }
}
```

---

## 6. آمار بازی‌ها

### 6.1. Game Statistics Service

```typescript
// backend/src/modules/users/services/userStatisticsService.ts

import { db } from '../../../shared/database/connection';

export class UserStatisticsService {
    async getGameHistory(
        userId: number,
        limit: number = 10,
        offset: number = 0
    ): Promise<GameHistoryItem[]> {
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

        return result.rows.map(row => ({
            id: row.id,
            startedAt: row.started_at,
            endedAt: row.ended_at,
            totalScore: row.total_score,
            correctAnswers: row.correct_answers,
            wrongAnswers: row.wrong_answers,
            status: row.status,
            timeSpent: row.time_spent,
            category: row.category_name ? {
                name: row.category_name,
                icon: row.category_icon
            } : null
        }));
    }

    async getGameStatistics(userId: number): Promise<GameStatistics> {
        // Overall statistics
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

        const row = overall.rows[0];
        const totalAnswers = parseInt(row.total_correct || 0) + parseInt(row.total_wrong || 0);
        const accuracy = totalAnswers > 0
            ? (parseInt(row.total_correct || 0) / totalAnswers) * 100
            : 0;

        // Recent games (last 7 days)
        const recentGames = await db.query(
            `SELECT COUNT(*) as count
             FROM matches
             WHERE user_id = $1 
               AND started_at >= CURRENT_DATE - INTERVAL '7 days'`,
            [userId]
        );

        // Category breakdown
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
            recentGames: parseInt(recentGames.rows[0].count || 0),
            categoryBreakdown: categoryBreakdown.rows.map(cat => ({
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

## 7. امنیت

### 7.1. Password Validation

```typescript
// backend/src/shared/utils/passwordValidator.ts

export class PasswordValidator {
    static validate(password: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters');
        }

        if (password.length > 255) {
            errors.push('Password must be less than 255 characters');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}
```

### 7.2. Rate Limiting

```typescript
// backend/src/shared/middleware/rateLimiter.ts

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Login rate limiter
export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

// Registration rate limiter
export const registerRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour
    message: 'Too many registration attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

// General API rate limiter
export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});
```

### 7.3. Input Sanitization

```typescript
// backend/src/shared/utils/sanitizer.ts

import DOMPurify from 'isomorphic-dompurify';

export class Sanitizer {
    static sanitizeString(input: string): string {
        // Remove HTML tags
        let sanitized = DOMPurify.sanitize(input, { 
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: []
        });

        // Trim whitespace
        sanitized = sanitized.trim();

        return sanitized;
    }

    static sanitizeEmail(email: string): string {
        return email.toLowerCase().trim();
    }

    static sanitizeUsername(username: string): string {
        // Remove special characters, keep only alphanumeric and underscore
        return username.replace(/[^a-zA-Z0-9_]/g, '').trim();
    }
}
```

### 7.4. Security Headers

```typescript
// backend/src/shared/middleware/security.ts

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});
```

---

## 📊 Data Types

```typescript
// Types definitions

interface User {
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

interface UserProfile {
    id: number;
    username: string;
    email: string;
    level: number;
    xp: number;
    totalScore: number;
    avatarUrl: string | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    stats: UserStats;
}

interface AuthResponse {
    user: {
        id: number;
        username: string;
        email: string;
        level: number;
        xp: number;
        totalScore: number;
        avatarUrl: string | null;
    };
    accessToken: string;
    refreshToken: string;
}

interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

interface LevelUpResult {
    oldLevel: number;
    newLevel: number;
    oldXP: number;
    newXP: number;
    xpGained: number;
    leveledUp: boolean;
    xpForNextLevel: number;
}

interface XPProgress {
    currentLevel: number;
    currentXP: number;
    xpInCurrentLevel: number;
    xpNeededForNextLevel: number;
    progress: number;
    nextLevelXP: number;
}

interface UserStats {
    overall: {
        games_played: number;
        total_questions: number;
        correct_answers: number;
        wrong_answers: number;
        best_score: number;
        average_score: number;
        accuracy_rate: number;
    } | null;
    byCategory: Array<{
        category_id: number;
        category_name: string;
        category_icon: string;
        games_played: number;
        best_score: number;
        accuracy_rate: number;
    }>;
}

interface GameStatistics {
    overall: {
        totalGames: number;
        completedGames: number;
        abandonedGames: number;
        totalScore: number;
        averageScore: number;
        bestScore: number;
        totalCorrect: number;
        totalWrong: number;
        accuracy: number;
        averageTime: number;
    };
    recentGames: number;
    categoryBreakdown: Array<{
        id: number;
        name: string;
        icon: string;
        gamesPlayed: number;
        averageScore: number;
        bestScore: number;
    }>;
}
```

---

## 🛣️ API Routes

```typescript
// backend/src/modules/auth/routes/authRoutes.ts

import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { loginRateLimiter, registerRateLimiter } from '../../../shared/middleware/rateLimiter';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', registerRateLimiter, (req, res) => 
    authController.register(req, res)
);

router.post('/login', loginRateLimiter, (req, res) => 
    authController.login(req, res)
);

router.post('/refresh', (req, res) => 
    authController.refreshToken(req, res)
);

export default router;
```

```typescript
// backend/src/modules/users/routes/userRoutes.ts

import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authMiddleware } from '../../../shared/middleware/auth';
import { apiRateLimiter } from '../../../shared/middleware/rateLimiter';

const router = Router();
const userController = new UserController();

// Protected routes
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

این سیستم مدیریت کاربران کامل است و شامل تمام ویژگی‌های درخواستی با امنیت پایه می‌باشد.

