# ماژول مسابقه آنلاین (Online Match) - پیاده‌سازی کامل

این سند شامل پیاده‌سازی کامل ماژول مسابقه آنلاین با کد تمیز، قابل تست و قابل توسعه است.

---

## 📋 فهرست

1. [DTOs](#1-dtos)
2. [Repository Layer](#2-repository-layer)
3. [Service Layer](#3-service-layer)
4. [Controller Layer](#4-controller-layer)
5. [Routes](#5-routes)
6. [WebSocket Integration](#6-websocket-integration)
7. [Error Handling](#7-error-handling)

---

## 1. DTOs

### 1.1. Create Match DTO

```typescript
// backend/src/modules/online-match/dto/createMatchDto.ts

import { z } from 'zod';

export const createMatchSchema = z.object({
    opponentUserId: z.number()
        .int('Opponent user ID must be an integer')
        .positive('Opponent user ID must be positive'),
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
        .max(30, 'Maximum 30 questions allowed for multiplayer')
        .default(10)
});

export type CreateMatchDto = z.infer<typeof createMatchSchema>;
```

### 1.2. Join Match DTO

```typescript
// backend/src/modules/online-match/dto/joinMatchDto.ts

import { z } from 'zod';

export const joinMatchSchema = z.object({
    matchId: z.number()
        .int('Match ID must be an integer')
        .positive('Match ID must be positive')
});

export type JoinMatchDto = z.infer<typeof joinMatchSchema>;
```

### 1.3. Match Status DTO

```typescript
// backend/src/modules/online-match/dto/matchStatusDto.ts

export interface MatchStatus {
    matchId: number;
    status: 'WAITING' | 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    player1: {
        userId: number;
        username: string;
        ready: boolean;
        score: number;
        answered: number;
    };
    player2: {
        userId: number;
        username: string;
        ready: boolean;
        score: number;
        answered: number;
    };
    currentQuestion?: {
        questionId: number;
        questionNumber: number;
        totalQuestions: number;
    };
    timeRemaining?: number;
}
```

---

## 2. Repository Layer

### 2.1. Online Match Repository

```typescript
// backend/src/modules/online-match/repositories/onlineMatchRepository.ts

import { db } from '../../../shared/database/connection';

export interface OnlineMatch {
    id: number;
    player1_id: number;
    player2_id: number;
    category_id: number | null;
    difficulty: string;
    questions_count: number;
    status: 'WAITING' | 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    player1_ready: boolean;
    player2_ready: boolean;
    player1_score: number;
    player2_score: number;
    player1_answered: number;
    player2_answered: number;
    current_question: number;
    started_at: Date | null;
    ended_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

export class OnlineMatchRepository {
    async create(matchData: {
        player1Id: number;
        player2Id: number;
        categoryId: number | null;
        difficulty: string;
        questionsCount: number;
    }): Promise<OnlineMatch> {
        const result = await db.query(
            `INSERT INTO online_matches (
                player1_id, player2_id, category_id, difficulty, questions_count,
                status, player1_ready, player2_ready, player1_score, player2_score,
                player1_answered, player2_answered, current_question,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, 'WAITING', false, false, 0, 0, 0, 0, 0,
                     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
                matchData.player1Id,
                matchData.player2Id,
                matchData.categoryId,
                matchData.difficulty,
                matchData.questionsCount
            ]
        );
        return result.rows[0];
    }

    async findById(id: number): Promise<OnlineMatch | null> {
        const result = await db.query(
            'SELECT * FROM online_matches WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    async findByUserId(userId: number, status?: string): Promise<OnlineMatch[]> {
        let query = `
            SELECT * FROM online_matches
            WHERE (player1_id = $1 OR player2_id = $1)
        `;
        const params: any[] = [userId];

        if (status) {
            query += ' AND status = $2';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const result = await db.query(query, params);
        return result.rows;
    }

    async findWaitingMatches(): Promise<OnlineMatch[]> {
        const result = await db.query(
            `SELECT * FROM online_matches
             WHERE status = 'WAITING'
             ORDER BY created_at ASC`,
            []
        );
        return result.rows;
    }

    async update(id: number, updates: {
        status?: string;
        player1Ready?: boolean;
        player2Ready?: boolean;
        player1Score?: number;
        player2Score?: number;
        player1Answered?: number;
        player2Answered?: number;
        currentQuestion?: number;
        startedAt?: Date;
        endedAt?: Date;
    }): Promise<OnlineMatch> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updates.status !== undefined) {
            fields.push(`status = $${paramIndex++}`);
            values.push(updates.status);
        }
        if (updates.player1Ready !== undefined) {
            fields.push(`player1_ready = $${paramIndex++}`);
            values.push(updates.player1Ready);
        }
        if (updates.player2Ready !== undefined) {
            fields.push(`player2_ready = $${paramIndex++}`);
            values.push(updates.player2Ready);
        }
        if (updates.player1Score !== undefined) {
            fields.push(`player1_score = player1_score + $${paramIndex++}`);
            values.push(updates.player1Score);
        }
        if (updates.player2Score !== undefined) {
            fields.push(`player2_score = player2_score + $${paramIndex++}`);
            values.push(updates.player2Score);
        }
        if (updates.player1Answered !== undefined) {
            fields.push(`player1_answered = player1_answered + $${paramIndex++}`);
            values.push(updates.player1Answered);
        }
        if (updates.player2Answered !== undefined) {
            fields.push(`player2_answered = player2_answered + $${paramIndex++}`);
            values.push(updates.player2Answered);
        }
        if (updates.currentQuestion !== undefined) {
            fields.push(`current_question = $${paramIndex++}`);
            values.push(updates.currentQuestion);
        }
        if (updates.startedAt !== undefined) {
            fields.push(`started_at = $${paramIndex++}`);
            values.push(updates.startedAt);
        }
        if (updates.endedAt !== undefined) {
            fields.push(`ended_at = $${paramIndex++}`);
            values.push(updates.endedAt);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const result = await db.query(
            `UPDATE online_matches SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        return result.rows[0];
    }

    async addMatchQuestion(matchId: number, questionId: number, order: number): Promise<void> {
        await db.query(
            `INSERT INTO online_match_questions (match_id, question_id, question_order, created_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
            [matchId, questionId, order]
        );
    }

    async getMatchQuestions(matchId: number): Promise<Array<{ question_id: number; question_order: number }>> {
        const result = await db.query(
            `SELECT question_id, question_order
             FROM online_match_questions
             WHERE match_id = $1
             ORDER BY question_order ASC`,
            [matchId]
        );
        return result.rows;
    }
}
```

---

## 3. Service Layer

### 3.1. Online Match Service

```typescript
// backend/src/modules/online-match/services/onlineMatchService.ts

import { OnlineMatchRepository } from '../repositories/onlineMatchRepository';
import { QuestionService } from '../../questions/services/questionService';
import { ScoringService } from '../../scoring/services/scoringService';
import { UserRepository } from '../../users/repositories/userRepository';
import { CreateMatchDto } from '../dto/createMatchDto';
import { MatchStatus } from '../dto/matchStatusDto';

export class OnlineMatchService {
    private matchRepository: OnlineMatchRepository;
    private questionService: QuestionService;
    private scoringService: ScoringService;
    private userRepository: UserRepository;

    constructor() {
        this.matchRepository = new OnlineMatchRepository();
        this.questionService = new QuestionService();
        this.scoringService = new ScoringService();
        this.userRepository = new UserRepository();
    }

    async createMatch(userId: number, dto: CreateMatchDto): Promise<OnlineMatch> {
        // Validate opponent
        const opponent = await this.userRepository.findById(dto.opponentUserId);
        if (!opponent || !opponent.is_active) {
            throw new Error('Opponent not found or inactive');
        }

        if (opponent.id === userId) {
            throw new Error('Cannot create match with yourself');
        }

        // Check if opponent is available
        const opponentActiveMatches = await this.matchRepository.findByUserId(
            dto.opponentUserId,
            'WAITING'
        );
        if (opponentActiveMatches.length > 0) {
            throw new Error('Opponent is already in a waiting match');
        }

        // Check if user has active match
        const userActiveMatches = await this.matchRepository.findByUserId(userId, 'WAITING');
        if (userActiveMatches.length > 0) {
            throw new Error('You already have a waiting match');
        }

        // Create match
        const match = await this.matchRepository.create({
            player1Id: userId,
            player2Id: dto.opponentUserId,
            categoryId: dto.categoryId || null,
            difficulty: dto.difficulty,
            questionsCount: dto.questionsCount
        });

        // Select questions
        const questions = await this.questionService.getRandomQuestions({
            categoryId: dto.categoryId,
            difficulty: dto.difficulty,
            count: dto.questionsCount
        });

        // Save questions
        for (let i = 0; i < questions.length; i++) {
            await this.matchRepository.addMatchQuestion(
                match.id,
                questions[i].id,
                i + 1
            );
        }

        return match;
    }

    async joinMatch(matchId: number, userId: number): Promise<OnlineMatch> {
        const match = await this.matchRepository.findById(matchId);
        if (!match) {
            throw new Error('Match not found');
        }

        if (match.player1_id !== userId && match.player2_id !== userId) {
            throw new Error('You are not part of this match');
        }

        if (match.status !== 'WAITING') {
            throw new Error('Match is not waiting for players');
        }

        // Mark player as ready
        if (match.player1_id === userId) {
            await this.matchRepository.update(matchId, { player1Ready: true });
        } else {
            await this.matchRepository.update(matchId, { player2Ready: true });
        }

        // Check if both players are ready
        const updatedMatch = await this.matchRepository.findById(matchId);
        if (updatedMatch?.player1_ready && updatedMatch?.player2_ready) {
            await this.matchRepository.update(matchId, {
                status: 'STARTED',
                startedAt: new Date(),
                currentQuestion: 1
            });
        }

        return await this.matchRepository.findById(matchId) as OnlineMatch;
    }

    async getMatchStatus(matchId: number, userId: number): Promise<MatchStatus> {
        const match = await this.matchRepository.findById(matchId);
        if (!match) {
            throw new Error('Match not found');
        }

        if (match.player1_id !== userId && match.player2_id !== userId) {
            throw new Error('You are not part of this match');
        }

        const player1 = await this.userRepository.findById(match.player1_id);
        const player2 = await this.userRepository.findById(match.player2_id);

        if (!player1 || !player2) {
            throw new Error('Player not found');
        }

        const matchQuestions = await this.matchRepository.getMatchQuestions(matchId);
        const currentQuestion = matchQuestions[match.current_question - 1];

        return {
            matchId: match.id,
            status: match.status as any,
            player1: {
                userId: match.player1_id,
                username: player1.username,
                ready: match.player1_ready,
                score: match.player1_score,
                answered: match.player1_answered
            },
            player2: {
                userId: match.player2_id,
                username: player2.username,
                ready: match.player2_ready,
                score: match.player2_score,
                answered: match.player2_answered
            },
            currentQuestion: currentQuestion ? {
                questionId: currentQuestion.question_id,
                questionNumber: match.current_question,
                totalQuestions: match.questions_count
            } : undefined
        };
    }

    async submitAnswer(
        matchId: number,
        userId: number,
        questionId: number,
        selectedOptionId: number,
        timeTaken: number
    ): Promise<{ isCorrect: boolean; points: number; opponentAnswered: boolean }> {
        const match = await this.matchRepository.findById(matchId);
        if (!match) {
            throw new Error('Match not found');
        }

        if (match.status !== 'STARTED' && match.status !== 'IN_PROGRESS') {
            throw new Error('Match is not in progress');
        }

        // Get question
        const question = await this.questionService.getQuestionById(questionId, true);
        if (!question) {
            throw new Error('Question not found');
        }

        const correctOption = question.options.find(opt => opt.is_correct);
        if (!correctOption) {
            throw new Error('Correct answer not found');
        }

        const isCorrect = selectedOptionId === correctOption.id;
        const points = isCorrect
            ? this.scoringService.calculatePoints(question, timeTaken)
            : 0;

        // Update match scores
        const isPlayer1 = match.player1_id === userId;
        if (isPlayer1) {
            await this.matchRepository.update(matchId, {
                player1Score: points,
                player1Answered: 1
            });
        } else {
            await this.matchRepository.update(matchId, {
                player2Score: points,
                player2Answered: 1
            });
        }

        // Check if both players answered
        const updatedMatch = await this.matchRepository.findById(matchId);
        const bothAnswered = (isPlayer1 && updatedMatch?.player2_answered === match.player2_answered + 1) ||
                            (!isPlayer1 && updatedMatch?.player1_answered === match.player1_answered + 1);

        // Move to next question if both answered
        if (bothAnswered && updatedMatch) {
            if (updatedMatch.current_question >= updatedMatch.questions_count) {
                // Game completed
                await this.matchRepository.update(matchId, {
                    status: 'COMPLETED',
                    endedAt: new Date()
                });
            } else {
                // Next question
                await this.matchRepository.update(matchId, {
                    status: 'IN_PROGRESS',
                    currentQuestion: updatedMatch.current_question + 1,
                    player1Answered: 0,
                    player2Answered: 0
                });
            }
        } else {
            // Update status to IN_PROGRESS if not already
            if (updatedMatch?.status === 'STARTED') {
                await this.matchRepository.update(matchId, {
                    status: 'IN_PROGRESS'
                });
            }
        }

        return {
            isCorrect,
            points,
            opponentAnswered: bothAnswered
        };
    }

    async getMatchResult(matchId: number, userId: number): Promise<MatchResult> {
        const match = await this.matchRepository.findById(matchId);
        if (!match) {
            throw new Error('Match not found');
        }

        if (match.status !== 'COMPLETED') {
            throw new Error('Match is not completed yet');
        }

        const player1 = await this.userRepository.findById(match.player1_id);
        const player2 = await this.userRepository.findById(match.player2_id);

        if (!player1 || !player2) {
            throw new Error('Player not found');
        }

        const isPlayer1 = match.player1_id === userId;
        const userScore = isPlayer1 ? match.player1_score : match.player2_score;
        const opponentScore = isPlayer1 ? match.player2_score : match.player1_score;

        let result: 'WIN' | 'LOSS' | 'TIE';
        if (userScore > opponentScore) {
            result = 'WIN';
        } else if (userScore < opponentScore) {
            result = 'LOSS';
        } else {
            result = 'TIE';
        }

        return {
            matchId: match.id,
            result,
            userScore,
            opponentScore,
            opponent: {
                userId: isPlayer1 ? match.player2_id : match.player1_id,
                username: isPlayer1 ? player2.username : player1.username
            },
            startedAt: match.started_at,
            endedAt: match.ended_at
        };
    }
}
```

---

## 4. Controller Layer

```typescript
// backend/src/modules/online-match/controllers/onlineMatchController.ts

import { Response } from 'express';
import { AuthRequest } from '../../../shared/middleware/auth';
import { OnlineMatchService } from '../services/onlineMatchService';
import { createMatchSchema } from '../dto/createMatchDto';
import { joinMatchSchema } from '../dto/joinMatchDto';
import { z } from 'zod';

export class OnlineMatchController {
    private matchService: OnlineMatchService;

    constructor() {
        this.matchService = new OnlineMatchService();
    }

    async createMatch(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const validatedData = createMatchSchema.parse(req.body);
            const match = await this.matchService.createMatch(
                req.user.userId,
                validatedData
            );

            res.status(201).json({
                success: true,
                data: match,
                message: 'Match created successfully'
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
                    error: error.message || 'Failed to create match'
                });
            }
        }
    }

    async joinMatch(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const matchId = parseInt(req.params.matchId);
            if (isNaN(matchId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid match ID'
                });
                return;
            }

            const match = await this.matchService.joinMatch(matchId, req.user.userId);

            res.json({
                success: true,
                data: match,
                message: 'Joined match successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to join match'
            });
        }
    }

    async getMatchStatus(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const matchId = parseInt(req.params.matchId);
            if (isNaN(matchId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid match ID'
                });
                return;
            }

            const status = await this.matchService.getMatchStatus(matchId, req.user.userId);

            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to get match status'
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

            const matchId = parseInt(req.params.matchId);
            if (isNaN(matchId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid match ID'
                });
                return;
            }

            const { questionId, selectedOptionId, timeTaken } = req.body;

            if (!questionId || !selectedOptionId || timeTaken === undefined) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required fields: questionId, selectedOptionId, timeTaken'
                });
                return;
            }

            const result = await this.matchService.submitAnswer(
                matchId,
                req.user.userId,
                questionId,
                selectedOptionId,
                timeTaken
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to submit answer'
            });
        }
    }

    async getMatchResult(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const matchId = parseInt(req.params.matchId);
            if (isNaN(matchId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid match ID'
                });
                return;
            }

            const result = await this.matchService.getMatchResult(matchId, req.user.userId);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to get match result'
            });
        }
    }
}
```

---

## 5. Routes

```typescript
// backend/src/modules/online-match/routes/onlineMatchRoutes.ts

import { Router } from 'express';
import { OnlineMatchController } from '../controllers/onlineMatchController';
import { authMiddleware } from '../../../shared/middleware/auth';
import { apiRateLimiter } from '../../../shared/middleware/rateLimiter';

const router = Router();
const matchController = new OnlineMatchController();

router.post('/', authMiddleware, apiRateLimiter, (req, res) => 
    matchController.createMatch(req, res)
);

router.post('/:matchId/join', authMiddleware, apiRateLimiter, (req, res) => 
    matchController.joinMatch(req, res)
);

router.get('/:matchId/status', authMiddleware, apiRateLimiter, (req, res) => 
    matchController.getMatchStatus(req, res)
);

router.post('/:matchId/answer', authMiddleware, apiRateLimiter, (req, res) => 
    matchController.submitAnswer(req, res)
);

router.get('/:matchId/result', authMiddleware, apiRateLimiter, (req, res) => 
    matchController.getMatchResult(req, res)
);

export default router;
```

---

## 6. WebSocket Integration

### 6.1. WebSocket Service

```typescript
// backend/src/modules/online-match/services/websocketService.ts

import { Server as SocketIOServer } from 'socket.io';
import { OnlineMatchService } from './onlineMatchService';

export class WebSocketService {
    private io: SocketIOServer;
    private matchService: OnlineMatchService;
    private matchRooms: Map<number, Set<string>> = new Map();

    constructor(io: SocketIOServer) {
        this.io = io;
        this.matchService = new OnlineMatchService();
        this.setupSocketHandlers();
    }

    private setupSocketHandlers(): void {
        this.io.on('connection', (socket) => {
            socket.on('join-match', async (data: { matchId: number; userId: number }) => {
                try {
                    const { matchId, userId } = data;
                    const room = `match-${matchId}`;
                    
                    socket.join(room);
                    
                    // Track socket in match room
                    if (!this.matchRooms.has(matchId)) {
                        this.matchRooms.set(matchId, new Set());
                    }
                    this.matchRooms.get(matchId)?.add(socket.id);

                    // Get match status and emit to all in room
                    const status = await this.matchService.getMatchStatus(matchId, userId);
                    this.io.to(room).emit('match-status', status);

                    socket.emit('joined-match', { matchId, room });
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('submit-answer', async (data: {
                matchId: number;
                userId: number;
                questionId: number;
                selectedOptionId: number;
                timeTaken: number;
            }) => {
                try {
                    const result = await this.matchService.submitAnswer(
                        data.matchId,
                        data.userId,
                        data.questionId,
                        data.selectedOptionId,
                        data.timeTaken
                    );

                    const room = `match-${data.matchId}`;
                    const status = await this.matchService.getMatchStatus(data.matchId, data.userId);

                    // Emit answer result to sender
                    socket.emit('answer-result', result);

                    // Emit updated status to all in room
                    this.io.to(room).emit('match-status', status);

                    // If both answered, emit next question
                    if (result.opponentAnswered) {
                        this.io.to(room).emit('next-question', status.currentQuestion);
                    }
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('disconnect', () => {
                // Remove socket from match rooms
                this.matchRooms.forEach((sockets, matchId) => {
                    if (sockets.has(socket.id)) {
                        sockets.delete(socket.id);
                        if (sockets.size === 0) {
                            this.matchRooms.delete(matchId);
                        }
                    }
                });
            });
        });
    }

    emitMatchUpdate(matchId: number, data: any): void {
        const room = `match-${matchId}`;
        this.io.to(room).emit('match-update', data);
    }
}
```

---

## 7. Error Handling

```typescript
// backend/src/shared/utils/errors.ts

export class MatchNotFoundError extends Error {
    constructor(matchId: number) {
        super(`Match with ID ${matchId} not found`);
        this.name = 'MatchNotFoundError';
    }
}

export class MatchNotAvailableError extends Error {
    constructor(message: string = 'Match is not available') {
        super(message);
        this.name = 'MatchNotAvailableError';
    }
}

export class PlayerNotInMatchError extends Error {
    constructor() {
        super('You are not part of this match');
        this.name = 'PlayerNotInMatchError';
    }
}
```

---

## 📊 API Endpoints

```
POST   /api/online-match                    - Create new match
POST   /api/online-match/:matchId/join      - Join match
GET    /api/online-match/:matchId/status    - Get match status
POST   /api/online-match/:matchId/answer   - Submit answer
GET    /api/online-match/:matchId/result    - Get match result
```

---

## 🔄 Match Flow

```
1. Player 1 creates match → WAITING
2. Player 2 joins match → Both ready
3. Match starts → STARTED
4. Question 1 displayed → IN_PROGRESS
5. Both players answer → Next question or COMPLETED
6. Match ends → Show results
```

---

این ماژول مسابقه آنلاین کامل است و آماده استفاده می‌باشد.

