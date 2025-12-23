# ماژول پیشرفت (Progress) - پیاده‌سازی کامل

این سند شامل پیاده‌سازی کامل ماژول پیشرفت کاربر (Level, XP, Stats, Achievements) با کد تمیز، قابل تست و قابل توسعه است.

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

### 1.1. Add XP DTO

```typescript
// backend/src/modules/progress/dto/addXPDto.ts

import { z } from 'zod';

export const addXPSchema = z.object({
    userId: z.number()
        .int('User ID must be an integer')
        .positive('User ID must be positive'),
    xpAmount: z.number()
        .int('XP amount must be an integer')
        .min(0, 'XP amount cannot be negative')
        .max(1000, 'XP amount cannot exceed 1000')
});

export type AddXPDto = z.infer<typeof addXPSchema>;
```

### 1.2. Get Progress Query DTO

```typescript
// backend/src/modules/progress/dto/getProgressQueryDto.ts

import { z } from 'zod';

export const getProgressQuerySchema = z.object({
    categoryId: z.string()
        .regex(/^\d+$/, 'Category ID must be a number')
        .transform(Number)
        .optional()
});

export type GetProgressQueryDto = z.infer<typeof getProgressQuerySchema>;
```

---

## 2. Repository Layer

### 2.1. Progress Repository

```typescript
// backend/src/modules/progress/repositories/progressRepository.ts

import { db } from '../../../shared/database/connection';

export interface UserStats {
    id: number;
    user_id: number;
    category_id: number | null;
    games_played: number;
    total_questions: number;
    correct_answers: number;
    wrong_answers: number;
    best_score: number;
    average_score: number;
    average_time: number;
    accuracy_rate: number;
    last_played_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

export class ProgressRepository {
    async getUserStats(userId: number, categoryId: number | null = null): Promise<UserStats | null> {
        const result = await db.query(
            `SELECT * FROM user_stats
             WHERE user_id = $1 AND category_id IS NOT DISTINCT FROM $2`,
            [userId, categoryId]
        );
        return result.rows[0] || null;
    }

    async createUserStats(statsData: {
        userId: number;
        categoryId: number | null;
        gamesPlayed?: number;
        totalQuestions?: number;
        correctAnswers?: number;
        wrongAnswers?: number;
        bestScore?: number;
        averageScore?: number;
        averageTime?: number;
        accuracyRate?: number;
    }): Promise<UserStats> {
        const result = await db.query(
            `INSERT INTO user_stats (
                user_id, category_id, games_played, total_questions,
                correct_answers, wrong_answers, best_score, average_score,
                average_time, accuracy_rate, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
                statsData.userId,
                statsData.categoryId,
                statsData.gamesPlayed || 0,
                statsData.totalQuestions || 0,
                statsData.correctAnswers || 0,
                statsData.wrongAnswers || 0,
                statsData.bestScore || 0,
                statsData.averageScore || 0,
                statsData.averageTime || 0,
                statsData.accuracyRate || 0
            ]
        );
        return result.rows[0];
    }

    async updateUserStats(
        userId: number,
        categoryId: number | null,
        updates: {
            gamesPlayed?: number;
            totalQuestions?: number;
            correctAnswers?: number;
            wrongAnswers?: number;
            bestScore?: number;
            averageScore?: number;
            averageTime?: number;
            accuracyRate?: number;
        }
    ): Promise<UserStats> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updates.gamesPlayed !== undefined) {
            fields.push(`games_played = $${paramIndex++}`);
            values.push(updates.gamesPlayed);
        }
        if (updates.totalQuestions !== undefined) {
            fields.push(`total_questions = $${paramIndex++}`);
            values.push(updates.totalQuestions);
        }
        if (updates.correctAnswers !== undefined) {
            fields.push(`correct_answers = $${paramIndex++}`);
            values.push(updates.correctAnswers);
        }
        if (updates.wrongAnswers !== undefined) {
            fields.push(`wrong_answers = $${paramIndex++}`);
            values.push(updates.wrongAnswers);
        }
        if (updates.bestScore !== undefined) {
            fields.push(`best_score = $${paramIndex++}`);
            values.push(updates.bestScore);
        }
        if (updates.averageScore !== undefined) {
            fields.push(`average_score = $${paramIndex++}`);
            values.push(updates.averageScore);
        }
        if (updates.averageTime !== undefined) {
            fields.push(`average_time = $${paramIndex++}`);
            values.push(updates.averageTime);
        }
        if (updates.accuracyRate !== undefined) {
            fields.push(`accuracy_rate = $${paramIndex++}`);
            values.push(updates.accuracyRate);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        fields.push(`last_played_at = CURRENT_TIMESTAMP`);
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(userId, categoryId);

        const result = await db.query(
            `UPDATE user_stats 
             SET ${fields.join(', ')} 
             WHERE user_id = $${paramIndex} AND category_id IS NOT DISTINCT FROM $${paramIndex + 1}
             RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            throw new Error('User stats not found');
        }

        return result.rows[0];
    }

    async getAllUserStats(userId: number): Promise<UserStats[]> {
        const result = await db.query(
            `SELECT us.*, c.name as category_name, c.icon as category_icon
             FROM user_stats us
             LEFT JOIN categories c ON c.id = us.category_id
             WHERE us.user_id = $1
             ORDER BY us.best_score DESC`,
            [userId]
        );
        return result.rows;
    }
}
```

### 2.2. Achievement Repository

```typescript
// backend/src/modules/progress/repositories/achievementRepository.ts

import { db } from '../../../shared/database/connection';

export interface Achievement {
    id: number;
    name: string;
    description: string;
    icon: string | null;
    achievement_type: string;
    requirement_value: number;
    xp_reward: number;
    is_active: boolean;
    created_at: Date;
}

export interface UserAchievement {
    user_id: number;
    achievement_id: number;
    unlocked_at: Date;
}

export class AchievementRepository {
    async findAll(includeInactive: boolean = false): Promise<Achievement[]> {
        let query = 'SELECT * FROM achievements';
        if (!includeInactive) {
            query += ' WHERE is_active = true';
        }
        query += ' ORDER BY achievement_type, requirement_value ASC';

        const result = await db.query(query);
        return result.rows;
    }

    async findById(id: number): Promise<Achievement | null> {
        const result = await db.query(
            'SELECT * FROM achievements WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    async getUserAchievements(userId: number): Promise<UserAchievement[]> {
        const result = await db.query(
            `SELECT ua.*, a.name, a.description, a.icon, a.achievement_type
             FROM user_achievements ua
             JOIN achievements a ON a.id = ua.achievement_id
             WHERE ua.user_id = $1
             ORDER BY ua.unlocked_at DESC`,
            [userId]
        );
        return result.rows;
    }

    async isAchievementUnlocked(userId: number, achievementId: number): Promise<boolean> {
        const result = await db.query(
            `SELECT 1 FROM user_achievements
             WHERE user_id = $1 AND achievement_id = $2`,
            [userId, achievementId]
        );
        return result.rows.length > 0;
    }

    async unlockAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
        const result = await db.query(
            `INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, achievement_id) DO NOTHING
             RETURNING *`,
            [userId, achievementId]
        );
        return result.rows[0];
    }
}
```

---

## 3. Service Layer

### 3.1. Progress Service

```typescript
// backend/src/modules/progress/services/progressService.ts

import { ProgressRepository } from '../repositories/progressRepository';
import { AchievementRepository } from '../repositories/achievementRepository';
import { UserRepository } from '../../users/repositories/userRepository';
import { ScoringService } from '../../scoring/services/scoringService';
import { db } from '../../../shared/database/connection';

export class ProgressService {
    private progressRepository: ProgressRepository;
    private achievementRepository: AchievementRepository;
    private userRepository: UserRepository;
    private scoringService: ScoringService;

    constructor() {
        this.progressRepository = new ProgressRepository();
        this.achievementRepository = new AchievementRepository();
        this.userRepository = new UserRepository();
        this.scoringService = new ScoringService();
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
        const newLevel = this.scoringService.calculateLevel(newXP);

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
            xpForNextLevel: this.scoringService.getXPForLevel(newLevel + 1)
        };
    }

    async getUserStats(userId: number, categoryId?: number): Promise<UserStatsResponse> {
        // Get overall stats
        const overallStats = await this.progressRepository.getUserStats(userId, null);

        // Get category stats
        const allStats = await this.progressRepository.getAllUserStats(userId);

        return {
            overall: overallStats ? this.mapStatsToResponse(overallStats) : null,
            byCategory: allStats
                .filter(s => s.category_id !== null)
                .map(s => ({
                    ...this.mapStatsToResponse(s),
                    categoryName: (s as any).category_name,
                    categoryIcon: (s as any).category_icon
                }))
        };
    }

    async initializeUserStats(userId: number): Promise<void> {
        // Check if already exists
        const existing = await this.progressRepository.getUserStats(userId, null);
        if (existing) {
            return; // Already initialized
        }

        // Create overall stats (category_id = NULL)
        await this.progressRepository.createUserStats({
            userId,
            categoryId: null,
            gamesPlayed: 0,
            totalQuestions: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            bestScore: 0,
            averageScore: 0,
            averageTime: 0,
            accuracyRate: 0
        });
    }

    async updateUserStats(
        userId: number,
        categoryId: number | null,
        gameStats: {
            totalScore: number;
            correctAnswers: number;
            wrongAnswers: number;
            averageTime: number;
        }
    ): Promise<void> {
        // Get or create stats
        let stats = await this.progressRepository.getUserStats(userId, categoryId);

        if (!stats) {
            // Create new stats
            const totalAnswers = gameStats.correctAnswers + gameStats.wrongAnswers;
            const accuracy = totalAnswers > 0
                ? (gameStats.correctAnswers / totalAnswers) * 100
                : 0;

            await this.progressRepository.createUserStats({
                userId,
                categoryId,
                gamesPlayed: 1,
                totalQuestions: totalAnswers,
                correctAnswers: gameStats.correctAnswers,
                wrongAnswers: gameStats.wrongAnswers,
                bestScore: gameStats.totalScore,
                averageScore: gameStats.totalScore,
                averageTime: gameStats.averageTime,
                accuracyRate: accuracy
            });
        } else {
            // Update existing stats
            const newGamesPlayed = stats.games_played + 1;
            const newTotalQuestions = stats.total_questions + gameStats.correctAnswers + gameStats.wrongAnswers;
            const newCorrectAnswers = stats.correct_answers + gameStats.correctAnswers;
            const newWrongAnswers = stats.wrong_answers + gameStats.wrongAnswers;
            const newBestScore = Math.max(stats.best_score, gameStats.totalScore);
            const newAverageScore = (
                (stats.average_score * stats.games_played) + gameStats.totalScore
            ) / newGamesPlayed;
            const newAccuracy = (newCorrectAnswers / newTotalQuestions) * 100;

            await this.progressRepository.updateUserStats(userId, categoryId, {
                gamesPlayed: newGamesPlayed,
                totalQuestions: newTotalQuestions,
                correctAnswers: newCorrectAnswers,
                wrongAnswers: newWrongAnswers,
                bestScore: newBestScore,
                averageScore: newAverageScore,
                averageTime: gameStats.averageTime,
                accuracyRate: newAccuracy
            });
        }
    }

    async checkAchievements(userId: number): Promise<Achievement[]> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const achievements = await this.achievementRepository.findAll();
        const unlockedAchievements: Achievement[] = [];

        for (const achievement of achievements) {
            // Check if already unlocked
            const alreadyUnlocked = await this.achievementRepository.isAchievementUnlocked(
                userId,
                achievement.id
            );
            if (alreadyUnlocked) {
                continue;
            }

            // Check achievement requirement
            let requirementMet = false;

            switch (achievement.achievement_type) {
                case 'LEVEL':
                    requirementMet = user.level >= achievement.requirement_value;
                    break;

                case 'SCORE':
                    requirementMet = user.total_score >= achievement.requirement_value;
                    break;

                case 'GAMES':
                    const gamesCount = await db.query(
                        `SELECT COUNT(*) as count FROM matches
                         WHERE user_id = $1 AND status = 'COMPLETED'`,
                        [userId]
                    );
                    requirementMet = parseInt(gamesCount.rows[0].count) >= achievement.requirement_value;
                    break;

                case 'CORRECT_ANSWERS':
                    const correctCount = await db.query(
                        `SELECT COUNT(*) as count FROM user_answers ua
                         JOIN matches m ON m.id = ua.match_id
                         WHERE m.user_id = $1 AND ua.is_correct = true`,
                        [userId]
                    );
                    requirementMet = parseInt(correctCount.rows[0].count) >= achievement.requirement_value;
                    break;

                case 'STREAK':
                    // Get longest streak of correct answers
                    const streakResult = await db.query(
                        `WITH streaks AS (
                            SELECT 
                                match_id,
                                ROW_NUMBER() OVER (PARTITION BY match_id ORDER BY answered_at) as rn,
                                is_correct
                            FROM user_answers ua
                            JOIN matches m ON m.id = ua.match_id
                            WHERE m.user_id = $1
                        )
                        SELECT MAX(streak_length) as max_streak
                        FROM (
                            SELECT 
                                match_id,
                                COUNT(*) as streak_length
                            FROM streaks
                            WHERE is_correct = true
                            GROUP BY match_id, rn
                        ) sub`,
                        [userId]
                    );
                    const maxStreak = parseInt(streakResult.rows[0]?.max_streak || 0);
                    requirementMet = maxStreak >= achievement.requirement_value;
                    break;
            }

            if (requirementMet) {
                // Unlock achievement
                await this.achievementRepository.unlockAchievement(userId, achievement.id);

                // Add XP reward
                if (achievement.xp_reward > 0) {
                    await this.addXP(userId, achievement.xp_reward);
                }

                unlockedAchievements.push(achievement);
            }
        }

        return unlockedAchievements;
    }

    async getUserAchievements(userId: number): Promise<UserAchievementResponse> {
        const achievements = await this.achievementRepository.findAll();
        const userAchievements = await this.achievementRepository.getUserAchievements(userId);

        const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));

        return {
            unlocked: userAchievements.map(ua => ({
                id: ua.achievement_id,
                name: (ua as any).name,
                description: (ua as any).description,
                icon: (ua as any).icon,
                unlockedAt: ua.unlocked_at
            })),
            locked: achievements
                .filter(a => !unlockedIds.has(a.id))
                .map(a => ({
                    id: a.id,
                    name: a.name,
                    description: a.description,
                    icon: a.icon,
                    requirement: {
                        type: a.achievement_type,
                        value: a.requirement_value
                    }
                }))
        };
    }

    private mapStatsToResponse(stats: UserStats): StatsResponse {
        return {
            gamesPlayed: stats.games_played,
            totalQuestions: stats.total_questions,
            correctAnswers: stats.correct_answers,
            wrongAnswers: stats.wrong_answers,
            bestScore: stats.best_score,
            averageScore: parseFloat(stats.average_score.toString()),
            averageTime: parseFloat(stats.average_time.toString()),
            accuracyRate: parseFloat(stats.accuracy_rate.toString()),
            lastPlayedAt: stats.last_played_at
        };
    }
}
```

---

## 4. Controller Layer

```typescript
// backend/src/modules/progress/controllers/progressController.ts

import { Response } from 'express';
import { AuthRequest } from '../../../shared/middleware/auth';
import { ProgressService } from '../services/progressService';
import { addXPSchema } from '../dto/addXPDto';
import { getProgressQuerySchema } from '../dto/getProgressQueryDto';
import { z } from 'zod';

export class ProgressController {
    private progressService: ProgressService;

    constructor() {
        this.progressService = new ProgressService();
    }

    async getUserProgress(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const validatedQuery = getProgressQuerySchema.parse(req.query);
            const stats = await this.progressService.getUserStats(
                req.user.userId,
                validatedQuery.categoryId
            );

            res.json({
                success: true,
                data: stats
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
                    error: error.message || 'Failed to get user progress'
                });
            }
        }
    }

    async getUserAchievements(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const achievements = await this.progressService.getUserAchievements(req.user.userId);

            res.json({
                success: true,
                data: achievements
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get achievements'
            });
        }
    }

    async addXP(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const validatedData = addXPSchema.parse({
                ...req.body,
                userId: req.user.userId
            });

            const result = await this.progressService.addXP(
                validatedData.userId,
                validatedData.xpAmount
            );

            res.json({
                success: true,
                data: result,
                message: result.leveledUp ? 'Level up!' : 'XP added successfully'
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
                    error: error.message || 'Failed to add XP'
                });
            }
        }
    }
}
```

---

## 5. Routes

```typescript
// backend/src/modules/progress/routes/progressRoutes.ts

import { Router } from 'express';
import { ProgressController } from '../controllers/progressController';
import { authMiddleware } from '../../../shared/middleware/auth';
import { apiRateLimiter } from '../../../shared/middleware/rateLimiter';

const router = Router();
const progressController = new ProgressController();

router.get('/', authMiddleware, apiRateLimiter, (req, res) => 
    progressController.getUserProgress(req, res)
);

router.get('/achievements', authMiddleware, apiRateLimiter, (req, res) => 
    progressController.getUserAchievements(req, res)
);

router.post('/add-xp', authMiddleware, apiRateLimiter, (req, res) => 
    progressController.addXP(req, res)
);

export default router;
```

---

## 📊 API Endpoints

```
GET    /api/progress                    - Get user progress/stats
GET    /api/progress/achievements       - Get user achievements
POST   /api/progress/add-xp            - Add XP (internal use)
```

---

## 📝 Type Definitions

```typescript
interface LevelUpResult {
    oldLevel: number;
    newLevel: number;
    oldXP: number;
    newXP: number;
    xpGained: number;
    leveledUp: boolean;
    xpForNextLevel: number;
}

interface UserStatsResponse {
    overall: StatsResponse | null;
    byCategory: Array<StatsResponse & {
        categoryName: string;
        categoryIcon: string | null;
    }>;
}

interface StatsResponse {
    gamesPlayed: number;
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    bestScore: number;
    averageScore: number;
    averageTime: number;
    accuracyRate: number;
    lastPlayedAt: Date | null;
}

interface UserAchievementResponse {
    unlocked: Array<{
        id: number;
        name: string;
        description: string;
        icon: string | null;
        unlockedAt: Date;
    }>;
    locked: Array<{
        id: number;
        name: string;
        description: string;
        icon: string | null;
        requirement: {
            type: string;
            value: number;
        };
    }>;
}
```

---

این ماژول پیشرفت کامل است و آماده استفاده می‌باشد.

