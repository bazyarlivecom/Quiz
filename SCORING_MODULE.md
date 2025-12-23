# ماژول امتیازدهی (Scoring) - پیاده‌سازی کامل

این سند شامل پیاده‌سازی کامل ماژول امتیازدهی با کد تمیز، قابل تست و قابل توسعه است.

---

## 📋 فهرست

1. [DTOs](#1-dtos)
2. [Service Layer](#2-service-layer)
3. [Controller Layer](#3-controller-layer)
4. [Routes](#4-routes)
5. [Validation](#5-validation)
6. [Error Handling](#6-error-handling)

---

## 1. DTOs

### 1.1. Calculate Score DTO

```typescript
// backend/src/modules/scoring/dto/calculateScoreDto.ts

import { z } from 'zod';

export const calculateScoreSchema = z.object({
    questionId: z.number()
        .int('Question ID must be an integer')
        .positive('Question ID must be positive'),
    isCorrect: z.boolean(),
    timeTaken: z.number()
        .int('Time taken must be an integer')
        .min(0, 'Time taken cannot be negative')
        .max(35, 'Time taken exceeds maximum allowed time')
});

export type CalculateScoreDto = z.infer<typeof calculateScoreSchema>;
```

### 1.2. Calculate XP DTO

```typescript
// backend/src/modules/scoring/dto/calculateXPDto.ts

import { z } from 'zod';

export const calculateXPSchema = z.object({
    questionId: z.number()
        .int('Question ID must be an integer')
        .positive('Question ID must be positive'),
    isCorrect: z.boolean(),
    timeTaken: z.number()
        .int('Time taken must be an integer')
        .min(0, 'Time taken cannot be negative')
        .max(35, 'Time taken exceeds maximum allowed time')
});

export type CalculateXPDto = z.infer<typeof calculateXPSchema>;
```

---

## 2. Service Layer

### 2.1. Scoring Service

```typescript
// backend/src/modules/scoring/services/scoringService.ts

import { QuestionService } from '../../questions/services/questionService';

export interface ScoreCalculation {
    basePoints: number;
    difficultyMultiplier: number;
    timeBonus: number;
    finalPoints: number;
}

export interface XPCalculation {
    baseXP: number;
    timeBonus: number;
    finalXP: number;
}

export class ScoringService {
    private questionService: QuestionService;

    constructor() {
        this.questionService = new QuestionService();
    }

    calculatePoints(question: any, timeTaken: number): number {
        // Base points from question
        const basePoints = question.points || 10;

        // Difficulty multiplier
        const difficultyMultiplier = this.getDifficultyMultiplier(question.difficulty);

        // Time bonus
        const timeBonus = this.calculateTimeBonus(timeTaken);

        // Final calculation
        const finalPoints = Math.round(
            basePoints * difficultyMultiplier * timeBonus
        );

        return finalPoints;
    }

    calculatePointsDetailed(question: any, timeTaken: number): ScoreCalculation {
        const basePoints = question.points || 10;
        const difficultyMultiplier = this.getDifficultyMultiplier(question.difficulty);
        const timeBonus = this.calculateTimeBonus(timeTaken);
        const finalPoints = Math.round(basePoints * difficultyMultiplier * timeBonus);

        return {
            basePoints,
            difficultyMultiplier,
            timeBonus,
            finalPoints
        };
    }

    calculateXP(question: any, isCorrect: boolean, timeTaken: number): number {
        if (!isCorrect) {
            return 0;
        }

        // Base XP by difficulty
        const baseXP = this.getBaseXP(question.difficulty);

        // Time bonus (20% if answered in less than 5 seconds)
        const timeBonus = timeTaken < 5 ? 0.2 : 0;

        return Math.round(baseXP * (1 + timeBonus));
    }

    calculateXPDetailed(question: any, isCorrect: boolean, timeTaken: number): XPCalculation {
        if (!isCorrect) {
            return {
                baseXP: 0,
                timeBonus: 0,
                finalXP: 0
            };
        }

        const baseXP = this.getBaseXP(question.difficulty);
        const timeBonus = timeTaken < 5 ? 0.2 : 0;
        const finalXP = Math.round(baseXP * (1 + timeBonus));

        return {
            baseXP,
            timeBonus,
            finalXP
        };
    }

    private getDifficultyMultiplier(difficulty: string): number {
        const multipliers: Record<string, number> = {
            'EASY': 1.0,
            'MEDIUM': 1.5,
            'HARD': 2.0,
            'EXPERT': 3.0
        };
        return multipliers[difficulty] || 1.0;
    }

    private calculateTimeBonus(timeTaken: number): number {
        if (timeTaken <= 5) {
            return 1.5;  // 50% bonus for very fast answer
        } else if (timeTaken <= 10) {
            return 1.3;  // 30% bonus
        } else if (timeTaken <= 20) {
            return 1.1;  // 10% bonus
        } else {
            return 1.0;  // No bonus
        }
    }

    private getBaseXP(difficulty: string): number {
        const baseXP: Record<string, number> = {
            'EASY': 10,
            'MEDIUM': 20,
            'HARD': 30,
            'EXPERT': 50
        };
        return baseXP[difficulty] || 10;
    }

    calculateLevel(xp: number): number {
        // Formula: level = floor(sqrt(xp / 100)) + 1
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    }

    getXPForLevel(level: number): number {
        // Formula: (level - 1)² × 100
        return Math.pow(level - 1, 2) * 100;
    }

    getXPProgress(currentXP: number, currentLevel: number): {
        xpInCurrentLevel: number;
        xpNeededForNextLevel: number;
        progress: number;
    } {
        const currentLevelXP = this.getXPForLevel(currentLevel);
        const nextLevelXP = this.getXPForLevel(currentLevel + 1);
        const xpInCurrentLevel = currentXP - currentLevelXP;
        const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
        const progress = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

        return {
            xpInCurrentLevel,
            xpNeededForNextLevel,
            progress: Math.min(100, Math.max(0, progress))
        };
    }
}
```

---

## 3. Controller Layer

```typescript
// backend/src/modules/scoring/controllers/scoringController.ts

import { Request, Response } from 'express';
import { ScoringService } from '../services/scoringService';
import { calculateScoreSchema } from '../dto/calculateScoreDto';
import { calculateXPSchema } from '../dto/calculateXPDto';
import { QuestionService } from '../../questions/services/questionService';
import { z } from 'zod';

export class ScoringController {
    private scoringService: ScoringService;
    private questionService: QuestionService;

    constructor() {
        this.scoringService = new ScoringService();
        this.questionService = new QuestionService();
    }

    async calculateScore(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = calculateScoreSchema.parse(req.body);

            // Get question
            const question = await this.questionService.getQuestionById(validatedData.questionId);
            if (!question) {
                res.status(404).json({
                    success: false,
                    error: 'Question not found'
                });
                return;
            }

            if (!validatedData.isCorrect) {
                res.json({
                    success: true,
                    data: {
                        points: 0,
                        calculation: {
                            basePoints: question.points,
                            difficultyMultiplier: 0,
                            timeBonus: 0,
                            finalPoints: 0
                        }
                    }
                });
                return;
            }

            const calculation = this.scoringService.calculatePointsDetailed(
                question,
                validatedData.timeTaken
            );

            res.json({
                success: true,
                data: {
                    points: calculation.finalPoints,
                    calculation
                }
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
                    error: error.message || 'Failed to calculate score'
                });
            }
        }
    }

    async calculateXP(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = calculateXPSchema.parse(req.body);

            // Get question
            const question = await this.questionService.getQuestionById(validatedData.questionId);
            if (!question) {
                res.status(404).json({
                    success: false,
                    error: 'Question not found'
                });
                return;
            }

            const calculation = this.scoringService.calculateXPDetailed(
                question,
                validatedData.isCorrect,
                validatedData.timeTaken
            );

            res.json({
                success: true,
                data: {
                    xp: calculation.finalXP,
                    calculation
                }
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
                    error: error.message || 'Failed to calculate XP'
                });
            }
        }
    }

    async getLevelInfo(req: Request, res: Response): Promise<void> {
        try {
            const xp = parseInt(req.query.xp as string);
            if (isNaN(xp) || xp < 0) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid XP value'
                });
                return;
            }

            const level = this.scoringService.calculateLevel(xp);
            const xpForNextLevel = this.scoringService.getXPForLevel(level + 1);
            const progress = this.scoringService.getXPProgress(xp, level);

            res.json({
                success: true,
                data: {
                    level,
                    xp,
                    xpForNextLevel,
                    progress
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get level info'
            });
        }
    }
}
```

---

## 4. Routes

```typescript
// backend/src/modules/scoring/routes/scoringRoutes.ts

import { Router } from 'express';
import { ScoringController } from '../controllers/scoringController';
import { apiRateLimiter } from '../../../shared/middleware/rateLimiter';

const router = Router();
const scoringController = new ScoringController();

router.post('/calculate-score', apiRateLimiter, (req, res) => 
    scoringController.calculateScore(req, res)
);

router.post('/calculate-xp', apiRateLimiter, (req, res) => 
    scoringController.calculateXP(req, res)
);

router.get('/level-info', apiRateLimiter, (req, res) => 
    scoringController.getLevelInfo(req, res)
);

export default router;
```

---

## 5. Validation

```typescript
// backend/src/modules/scoring/validators/scoringValidators.ts

export class ScoringValidators {
    static validateTimeTaken(timeTaken: number): { valid: boolean; error?: string } {
        if (timeTaken < 0) {
            return { valid: false, error: 'Time taken cannot be negative' };
        }

        if (timeTaken > 35) {
            return { valid: false, error: 'Time taken exceeds maximum allowed time (35 seconds)' };
        }

        return { valid: true };
    }

    static validateDifficulty(difficulty: string): { valid: boolean; error?: string } {
        const validDifficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];
        
        if (!validDifficulties.includes(difficulty)) {
            return { 
                valid: false, 
                error: `Difficulty must be one of: ${validDifficulties.join(', ')}` 
            };
        }

        return { valid: true };
    }
}
```

---

## 6. Error Handling

```typescript
// backend/src/shared/utils/errors.ts

export class InvalidScoringDataError extends Error {
    constructor(message: string) {
        super(`Invalid scoring data: ${message}`);
        this.name = 'InvalidScoringDataError';
    }
}

export class QuestionNotFoundForScoringError extends Error {
    constructor(questionId: number) {
        super(`Question with ID ${questionId} not found for scoring calculation`);
        this.name = 'QuestionNotFoundForScoringError';
    }
}
```

---

## 📊 API Endpoints

```
POST   /api/scoring/calculate-score  - Calculate points for answer
POST   /api/scoring/calculate-xp    - Calculate XP for answer
GET    /api/scoring/level-info?xp=500 - Get level information
```

---

## 🎯 Scoring Formulas

### Points Calculation:
```
Base Points = Question.points (default: 10)

Difficulty Multipliers:
- EASY: 1.0x
- MEDIUM: 1.5x
- HARD: 2.0x
- EXPERT: 3.0x

Time Bonuses:
- 0-5 seconds: 1.5x (50% bonus)
- 6-10 seconds: 1.3x (30% bonus)
- 11-20 seconds: 1.1x (10% bonus)
- 21-30 seconds: 1.0x (no bonus)

Final Points = Base Points × Difficulty Multiplier × Time Bonus
```

### XP Calculation:
```
Base XP by Difficulty:
- EASY: 10 XP
- MEDIUM: 20 XP
- HARD: 30 XP
- EXPERT: 50 XP

Time Bonus:
- If answered in < 5 seconds: +20% bonus
- Otherwise: No bonus

Final XP = Base XP × (1 + Time Bonus)
(Only if answer is correct, otherwise 0 XP)
```

### Level Calculation:
```
Level Formula: level = floor(sqrt(xp / 100)) + 1

XP for Level: (level - 1)² × 100

Example:
- Level 1: 0-100 XP
- Level 2: 101-400 XP
- Level 3: 401-900 XP
- Level 4: 901-1600 XP
```

---

این ماژول امتیازدهی کامل است و آماده استفاده می‌باشد.

