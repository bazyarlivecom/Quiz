# ماژول بازی (Quiz Game) - پیاده‌سازی کامل

این سند شامل پیاده‌سازی کامل ماژول بازی با کد تمیز، قابل تست و قابل توسعه است.

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

### 1.1. Start Game DTO

```typescript
// backend/src/modules/quiz/dto/startGameDto.ts

import { z } from 'zod';

export const startGameSchema = z.object({
    gameMode: z.enum(['SINGLE_PLAYER', 'MULTI_PLAYER', 'PRACTICE'], {
        errorMap: () => ({ message: 'Game mode must be SINGLE_PLAYER, MULTI_PLAYER, or PRACTICE' })
    }),
    categoryId: z.number()
        .int('Category ID must be an integer')
        .positive('Category ID must be positive')
        .optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'MIXED'])
        .optional()
        .default('MIXED'),
    questionsCount: z.number()
        .int('Questions count must be an integer')
        .min(5, 'Minimum 5 questions required')
        .max(50, 'Maximum 50 questions allowed')
        .default(10),
    practiceMode: z.boolean()
        .optional()
        .default(false), // For PRACTICE mode: no timer, no scoring, just learning
    opponentUserId: z.number()
        .int('Opponent user ID must be an integer')
        .positive('Opponent user ID must be positive')
        .optional()
}).refine(
    (data) => {
        if (data.gameMode === 'MULTI_PLAYER' && !data.opponentUserId) {
            return false;
        }
        return true;
    },
    {
        message: 'Opponent user ID is required for multiplayer mode',
        path: ['opponentUserId']
    }
);

export type StartGameDto = z.infer<typeof startGameSchema>;
```

### 1.2. Submit Answer DTO

```typescript
// backend/src/modules/quiz/dto/submitAnswerDto.ts

import { z } from 'zod';

export const submitAnswerSchema = z.object({
    questionId: z.number()
        .int('Question ID must be an integer')
        .positive('Question ID must be positive'),
    selectedOptionId: z.number()
        .int('Option ID must be an integer')
        .positive('Option ID must be positive'),
    timeTaken: z.number()
        .int('Time taken must be an integer')
        .min(0, 'Time taken cannot be negative')
        .max(35, 'Time taken exceeds maximum allowed time')
});

export type SubmitAnswerDto = z.infer<typeof submitAnswerSchema>;
```

### 1.3. Handle Timeout DTO

```typescript
// backend/src/modules/quiz/dto/handleTimeoutDto.ts

import { z } from 'zod';

export const handleTimeoutSchema = z.object({
    questionId: z.number()
        .int('Question ID must be an integer')
        .positive('Question ID must be positive')
});

export type HandleTimeoutDto = z.infer<typeof handleTimeoutSchema>;
```

---

## 2. Repository Layer

### 2.1. Quiz Session Repository

```typescript
// backend/src/modules/quiz/repositories/quizSessionRepository.ts

import { db } from '../../../shared/database/connection';

export interface QuizSession {
    id: number;
    user_id: number;
    category_id: number | null;
    difficulty: string;
    questions_count: number;
    started_at: Date;
    ended_at: Date | null;
    total_score: number;
    correct_answers: number;
    wrong_answers: number;
    status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED' | 'TIMED_OUT';
    time_spent: number | null;
    is_practice: boolean;
    game_mode: 'SINGLE_PLAYER' | 'MULTI_PLAYER' | 'PRACTICE';
    created_at: Date;
}

export interface MatchQuestion {
    id: number;
    match_id: number;
    question_id: number;
    question_order: number;
    created_at: Date;
}

export class QuizSessionRepository {
    async create(sessionData: {
        userId: number;
        categoryId: number | null;
        difficulty: string;
        questionsCount: number;
        gameMode: string;
        isPractice?: boolean;
        parentSessionId?: number;
    }): Promise<QuizSession> {
        const result = await db.query(
            `INSERT INTO matches (
                user_id, category_id, difficulty, questions_count,
                status, is_practice, game_mode, started_at, created_at
            ) VALUES ($1, $2, $3, $4, 'ACTIVE', $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
                sessionData.userId,
                sessionData.categoryId,
                sessionData.difficulty,
                sessionData.questionsCount,
                sessionData.isPractice || false,
                sessionData.gameMode
            ]
        );
        return result.rows[0];
    }

    async findById(id: number): Promise<QuizSession | null> {
        const result = await db.query(
            'SELECT * FROM matches WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    async findByUserId(userId: number, status?: string): Promise<QuizSession[]> {
        let query = 'SELECT * FROM matches WHERE user_id = $1';
        const params: any[] = [userId];

        if (status) {
            query += ' AND status = $2';
            params.push(status);
        }

        query += ' ORDER BY started_at DESC';

        const result = await db.query(query, params);
        return result.rows;
    }

    async update(id: number, updates: {
        totalScore?: number;
        correctAnswers?: number;
        wrongAnswers?: number;
        status?: string;
        endedAt?: Date;
        timeSpent?: number;
    }): Promise<QuizSession> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updates.totalScore !== undefined) {
            fields.push(`total_score = total_score + $${paramIndex++}`);
            values.push(updates.totalScore);
        }
        if (updates.correctAnswers !== undefined) {
            fields.push(`correct_answers = correct_answers + $${paramIndex++}`);
            values.push(updates.correctAnswers);
        }
        if (updates.wrongAnswers !== undefined) {
            fields.push(`wrong_answers = wrong_answers + $${paramIndex++}`);
            values.push(updates.wrongAnswers);
        }
        if (updates.status !== undefined) {
            fields.push(`status = $${paramIndex++}`);
            values.push(updates.status);
        }
        if (updates.endedAt !== undefined) {
            fields.push(`ended_at = $${paramIndex++}`);
            values.push(updates.endedAt);
        }
        if (updates.timeSpent !== undefined) {
            fields.push(`time_spent = $${paramIndex++}`);
            values.push(updates.timeSpent);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(id);

        const result = await db.query(
            `UPDATE matches SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        return result.rows[0];
    }

    async addMatchQuestion(matchId: number, questionId: number, order: number): Promise<MatchQuestion> {
        const result = await db.query(
            `INSERT INTO match_questions (match_id, question_id, question_order, created_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             RETURNING *`,
            [matchId, questionId, order]
        );
        return result.rows[0];
    }

    async getMatchQuestions(matchId: number): Promise<MatchQuestion[]> {
        const result = await db.query(
            `SELECT * FROM match_questions
             WHERE match_id = $1
             ORDER BY question_order ASC`,
            [matchId]
        );
        return result.rows;
    }

    async getAnsweredCount(matchId: number): Promise<number> {
        const result = await db.query(
            `SELECT COUNT(*) as count
             FROM user_answers
             WHERE match_id = $1`,
            [matchId]
        );
        return parseInt(result.rows[0].count);
    }
}
```

### 2.2. User Answer Repository

```typescript
// backend/src/modules/quiz/repositories/userAnswerRepository.ts

import { db } from '../../../shared/database/connection';

export interface UserAnswer {
    id: number;
    match_id: number;
    question_id: number;
    selected_option_id: number | null;
    user_answer_text: string | null;
    is_correct: boolean;
    time_taken: number;
    points_earned: number;
    answered_at: Date;
}

export class UserAnswerRepository {
    async create(answerData: {
        matchId: number;
        questionId: number;
        selectedOptionId: number | null;
        userAnswerText: string | null;
        isCorrect: boolean;
        timeTaken: number;
        pointsEarned: number;
    }): Promise<UserAnswer> {
        const result = await db.query(
            `INSERT INTO user_answers (
                match_id, question_id, selected_option_id, user_answer_text,
                is_correct, time_taken, points_earned, answered_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
                answerData.matchId,
                answerData.questionId,
                answerData.selectedOptionId,
                answerData.userAnswerText,
                answerData.isCorrect,
                answerData.timeTaken,
                answerData.pointsEarned
            ]
        );
        return result.rows[0];
    }

    async findByMatchAndQuestion(matchId: number, questionId: number): Promise<UserAnswer | null> {
        const result = await db.query(
            `SELECT * FROM user_answers
             WHERE match_id = $1 AND question_id = $2`,
            [matchId, questionId]
        );
        return result.rows[0] || null;
    }

    async getMatchAnswers(matchId: number): Promise<UserAnswer[]> {
        const result = await db.query(
            `SELECT * FROM user_answers
             WHERE match_id = $1
             ORDER BY answered_at ASC`,
            [matchId]
        );
        return result.rows;
    }
}
```

---

## 3. Service Layer

### 3.1. Quiz Service

```typescript
// backend/src/modules/quiz/services/quizService.ts

import { QuizSessionRepository } from '../repositories/quizSessionRepository';
import { UserAnswerRepository } from '../repositories/userAnswerRepository';
import { QuestionService } from '../../questions/services/questionService';
import { ScoringService } from '../../scoring/services/scoringService';
import { ProgressService } from '../../progress/services/progressService';
import { StartGameDto } from '../dto/startGameDto';
import { SubmitAnswerDto } from '../dto/submitAnswerDto';
import { db } from '../../../shared/database/connection';

export class QuizService {
    private sessionRepository: QuizSessionRepository;
    private answerRepository: UserAnswerRepository;
    private questionService: QuestionService;
    private scoringService: ScoringService;
    private progressService: ProgressService;

    constructor() {
        this.sessionRepository = new QuizSessionRepository();
        this.answerRepository = new UserAnswerRepository();
        this.questionService = new QuestionService();
        this.scoringService = new ScoringService();
        this.progressService = new ProgressService();
    }

    async startGame(userId: number, dto: StartGameDto): Promise<QuizSession> {
        // For PRACTICE mode, allow multiple active sessions
        if (dto.gameMode !== 'PRACTICE') {
            // Check if user has active game (except practice mode)
            const activeGames = await this.sessionRepository.findByUserId(userId, 'ACTIVE');
            if (activeGames.length > 0) {
                throw new Error('User already has an active game');
            }
        }

        // Validate opponent for multiplayer
        if (dto.gameMode === 'MULTI_PLAYER' && dto.opponentUserId) {
            const opponentActiveGames = await this.sessionRepository.findByUserId(
                dto.opponentUserId,
                'ACTIVE'
            );
            if (opponentActiveGames.length > 0) {
                throw new Error('Opponent is already in a game');
            }
        }

        // Create session
        const session = await this.sessionRepository.create({
            userId,
            categoryId: dto.categoryId || null,
            difficulty: dto.difficulty,
            questionsCount: dto.questionsCount,
            gameMode: dto.gameMode,
            isPractice: dto.gameMode === 'PRACTICE'
        });

        // Select questions
        const questions = await this.questionService.getRandomQuestions({
            categoryId: dto.categoryId,
            difficulty: dto.difficulty,
            count: dto.questionsCount
        });

        // Save questions to match_questions
        for (let i = 0; i < questions.length; i++) {
            await this.sessionRepository.addMatchQuestion(
                session.id,
                questions[i].id,
                i + 1
            );
        }

        // Create opponent session for multiplayer
        if (dto.gameMode === 'MULTI_PLAYER' && dto.opponentUserId) {
            const opponentSession = await this.sessionRepository.create({
                userId: dto.opponentUserId,
                categoryId: dto.categoryId || null,
                difficulty: dto.difficulty,
                questionsCount: dto.questionsCount,
                gameMode: dto.gameMode,
                parentSessionId: session.id
            });

            // Use same questions for opponent
            for (let i = 0; i < questions.length; i++) {
                await this.sessionRepository.addMatchQuestion(
                    opponentSession.id,
                    questions[i].id,
                    i + 1
                );
            }
        }

        return session;
    }

    async getCurrentQuestion(sessionId: number, userId: number): Promise<CurrentQuestion | null> {
        // Validate session
        const session = await this.sessionRepository.findById(sessionId);
        if (!session || session.user_id !== userId) {
            throw new Error('Session not found or access denied');
        }

        if (session.status !== 'ACTIVE') {
            throw new Error('Session is not active');
        }

        // Get answered count
        const answeredCount = await this.sessionRepository.getAnsweredCount(sessionId);

        if (answeredCount >= session.questions_count) {
            return null; // All questions answered
        }

        // Get current question
        const matchQuestions = await this.sessionRepository.getMatchQuestions(sessionId);
        const currentMatchQuestion = matchQuestions[answeredCount];

        if (!currentMatchQuestion) {
            return null;
        }

        // Get question with options
        const question = await this.questionService.getQuestionById(
            currentMatchQuestion.question_id,
            true
        );

        if (!question) {
            throw new Error('Question not found');
        }

        // Shuffle options (hide correct answer)
        const shuffledOptions = this.shuffleArray(question.options);

        // Check if practice mode
        const isPractice = (session as any).is_practice || false;

        return {
            questionId: question.id,
            questionText: question.question_text,
            options: shuffledOptions.map(opt => ({
                id: opt.id,
                text: opt.option_text,
                order: opt.option_order
            })),
            questionNumber: answeredCount + 1,
            totalQuestions: session.questions_count,
            timeLimit: isPractice ? null : 30, // No timer in practice mode
            isPractice: isPractice
        };
    }

    async submitAnswer(
        sessionId: number,
        userId: number,
        dto: SubmitAnswerDto
    ): Promise<AnswerResult> {
        // Validate session
        const session = await this.sessionRepository.findById(sessionId);
        if (!session || session.user_id !== userId) {
            throw new Error('Session not found or access denied');
        }

        if (session.status !== 'ACTIVE') {
            throw new Error('Session is not active');
        }

        // Check if already answered
        const existingAnswer = await this.answerRepository.findByMatchAndQuestion(
            sessionId,
            dto.questionId
        );
        if (existingAnswer) {
            throw new Error('Question already answered');
        }

        // Validate question belongs to session
        const matchQuestions = await this.sessionRepository.getMatchQuestions(sessionId);
        const questionInSession = matchQuestions.find(mq => mq.question_id === dto.questionId);
        if (!questionInSession) {
            throw new Error('Question not found in this session');
        }

        // Get question and correct answer
        const question = await this.questionService.getQuestionById(dto.questionId, true);
        if (!question) {
            throw new Error('Question not found');
        }

        const correctOption = question.options.find(opt => opt.is_correct);
        if (!correctOption) {
            throw new Error('Correct answer not found');
        }

        // Check if answer is correct
        const isCorrect = dto.selectedOptionId === correctOption.id;

        // Check if practice mode
        const isPractice = (session as any).is_practice || false;

        // In practice mode: no points, no XP, no stats update
        const pointsEarned = isPractice ? 0 : (isCorrect
            ? this.scoringService.calculatePoints(question, dto.timeTaken || 0)
            : 0);

        // Save answer
        const answer = await this.answerRepository.create({
            matchId: sessionId,
            questionId: dto.questionId,
            selectedOptionId: dto.selectedOptionId,
            userAnswerText: null,
            isCorrect,
            timeTaken: dto.timeTaken || 0,
            pointsEarned
        });

        // Update session stats (only for non-practice mode)
        if (!isPractice) {
            await this.sessionRepository.update(sessionId, {
                totalScore: pointsEarned,
                correctAnswers: isCorrect ? 1 : 0,
                wrongAnswers: isCorrect ? 0 : 1
            });

            // Update user XP if correct (only for non-practice mode)
            if (isCorrect) {
                const xpGained = this.scoringService.calculateXP(question, true, dto.timeTaken || 0);
                await this.progressService.addXP(userId, xpGained);
            }
        } else {
            // In practice mode, just track answers for session (no scoring)
            await this.sessionRepository.update(sessionId, {
                correctAnswers: isCorrect ? 1 : 0,
                wrongAnswers: isCorrect ? 0 : 1
            });
        }

        return {
            answerId: answer.id,
            isCorrect,
            correctOptionId: correctOption.id,
            pointsEarned,
            explanation: question.explanation
        };
    }

    async handleTimeout(
        sessionId: number,
        userId: number,
        questionId: number
    ): Promise<void> {
        // Validate session
        const session = await this.sessionRepository.findById(sessionId);
        if (!session || session.user_id !== userId) {
            throw new Error('Session not found or access denied');
        }

        // Check if already answered
        const existingAnswer = await this.answerRepository.findByMatchAndQuestion(
            sessionId,
            questionId
        );
        if (existingAnswer) {
            return; // Already answered
        }

        // Get question
        const question = await this.questionService.getQuestionById(questionId, true);
        if (!question) {
            throw new Error('Question not found');
        }

        // Save timeout answer (wrong, no points)
        await this.answerRepository.create({
            matchId: sessionId,
            questionId,
            selectedOptionId: null,
            userAnswerText: 'TIMEOUT',
            isCorrect: false,
            timeTaken: 30,
            pointsEarned: 0
        });

        // Update session stats
        await this.sessionRepository.update(sessionId, {
            wrongAnswers: 1
        });
    }

    async endGame(sessionId: number, userId: number): Promise<GameResult> {
        // Validate session
        const session = await this.sessionRepository.findById(sessionId);
        if (!session || session.user_id !== userId) {
            throw new Error('Session not found or access denied');
        }

        if (session.status !== 'ACTIVE') {
            throw new Error('Session is not active');
        }

        // Calculate final stats
        const answers = await this.answerRepository.getMatchAnswers(sessionId);
        const stats = this.calculateFinalStats(answers);

        // Check if practice mode
        const isPractice = (session as any).is_practice || false;

        // Calculate time spent
        const timeSpent = Math.floor(
            (new Date().getTime() - session.started_at.getTime()) / 1000
        );

        // In practice mode: don't update user stats, scores, or achievements
        if (!isPractice) {
            // Update user total score
            await db.query(
                `UPDATE users SET total_score = total_score + $1 WHERE id = $2`,
                [stats.totalScore, userId]
            );

            // Update user stats
            await this.progressService.updateUserStats(
                userId,
                session.category_id,
                stats
            );

            // Check achievements
            const achievements = await this.progressService.checkAchievements(userId);
        }

        // Mark session as completed
        await this.sessionRepository.update(sessionId, {
            status: 'COMPLETED',
            endedAt: new Date(),
            timeSpent
        });

        return {
            sessionId,
            userId,
            totalScore: isPractice ? 0 : stats.totalScore,
            correctAnswers: stats.correctAnswers,
            wrongAnswers: stats.wrongAnswers,
            accuracy: stats.accuracy,
            timeSpent,
            newAchievements: isPractice ? [] : achievements,
            isPractice: isPractice
        };
    }

    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    private calculateFinalStats(answers: UserAnswer[]): FinalStats {
        const totalScore = answers.reduce((sum, a) => sum + a.points_earned, 0);
        const correctAnswers = answers.filter(a => a.is_correct).length;
        const wrongAnswers = answers.filter(a => !a.is_correct).length;
        const totalAnswers = correctAnswers + wrongAnswers;
        const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
        const averageTime = answers.length > 0
            ? answers.reduce((sum, a) => sum + a.time_taken, 0) / answers.length
            : 0;

        return {
            totalScore,
            correctAnswers,
            wrongAnswers,
            accuracy: Math.round(accuracy * 100) / 100,
            averageTime: Math.round(averageTime * 100) / 100
        };
    }
}
```

---

## 4. Controller Layer

```typescript
// backend/src/modules/quiz/controllers/quizController.ts

import { Response } from 'express';
import { AuthRequest } from '../../../shared/middleware/auth';
import { QuizService } from '../services/quizService';
import { startGameSchema } from '../dto/startGameDto';
import { submitAnswerSchema } from '../dto/submitAnswerDto';
import { handleTimeoutSchema } from '../dto/handleTimeoutDto';
import { z } from 'zod';

export class QuizController {
    private quizService: QuizService;

    constructor() {
        this.quizService = new QuizService();
    }

    async startGame(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const validatedData = startGameSchema.parse(req.body);
            const session = await this.quizService.startGame(
                req.user.userId,
                validatedData
            );

            res.status(201).json({
                success: true,
                data: session,
                message: 'Game started successfully'
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
                    error: error.message || 'Failed to start game'
                });
            }
        }
    }

    async getCurrentQuestion(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const sessionId = parseInt(req.params.sessionId);
            if (isNaN(sessionId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid session ID'
                });
                return;
            }

            const question = await this.quizService.getCurrentQuestion(
                sessionId,
                req.user.userId
            );

            if (!question) {
                res.status(404).json({
                    success: false,
                    error: 'No more questions or game completed'
                });
                return;
            }

            res.json({
                success: true,
                data: question
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to get current question'
            });
        }
    }

    async submitAnswer(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const sessionId = parseInt(req.params.sessionId);
            if (isNaN(sessionId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid session ID'
                });
                return;
            }

            const validatedData = submitAnswerSchema.parse(req.body);
            const result = await this.quizService.submitAnswer(
                sessionId,
                req.user.userId,
                validatedData
            );

            res.json({
                success: true,
                data: result
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
                    error: error.message || 'Failed to submit answer'
                });
            }
        }
    }

    async handleTimeout(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const sessionId = parseInt(req.params.sessionId);
            if (isNaN(sessionId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid session ID'
                });
                return;
            }

            const validatedData = handleTimeoutSchema.parse(req.body);
            await this.quizService.handleTimeout(
                sessionId,
                req.user.userId,
                validatedData.questionId
            );

            res.json({
                success: true,
                message: 'Timeout handled successfully'
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
                    error: error.message || 'Failed to handle timeout'
                });
            }
        }
    }

    async endGame(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const sessionId = parseInt(req.params.sessionId);
            if (isNaN(sessionId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid session ID'
                });
                return;
            }

            const result = await this.quizService.endGame(
                sessionId,
                req.user.userId
            );

            res.json({
                success: true,
                data: result,
                message: 'Game ended successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to end game'
            });
        }
    }
}
```

---

## 5. Routes

```typescript
// backend/src/modules/quiz/routes/quizRoutes.ts

import { Router } from 'express';
import { QuizController } from '../controllers/quizController';
import { authMiddleware } from '../../../shared/middleware/auth';
import { apiRateLimiter } from '../../../shared/middleware/rateLimiter';

const router = Router();
const quizController = new QuizController();

router.post('/start', authMiddleware, apiRateLimiter, (req, res) => 
    quizController.startGame(req, res)
);

router.get('/:sessionId/question', authMiddleware, apiRateLimiter, (req, res) => 
    quizController.getCurrentQuestion(req, res)
);

router.post('/:sessionId/answer', authMiddleware, apiRateLimiter, (req, res) => 
    quizController.submitAnswer(req, res)
);

router.post('/:sessionId/timeout', authMiddleware, apiRateLimiter, (req, res) => 
    quizController.handleTimeout(req, res)
);

router.post('/:sessionId/end', authMiddleware, apiRateLimiter, (req, res) => 
    quizController.endGame(req, res)
);

export default router;
```

---

## 📊 API Endpoints

```
POST   /api/quiz/start                    - Start new game
GET    /api/quiz/:sessionId/question     - Get current question
POST   /api/quiz/:sessionId/answer       - Submit answer
POST   /api/quiz/:sessionId/timeout      - Handle timeout
POST   /api/quiz/:sessionId/end          - End game
```

---

این ماژول بازی کامل است و آماده استفاده می‌باشد.

