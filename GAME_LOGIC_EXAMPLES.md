# مثال‌های کد - منطق بازی

این فایل شامل مثال‌های کد واقعی برای بخش‌های کلیدی منطق بازی است.

---

## 1. Service Layer - Quiz Service

```typescript
// backend/src/modules/quiz/services/quizService.ts

import { db } from '../../../shared/database/connection';
import { QuestionService } from '../services/questionService';
import { ScoringService } from '../services/scoringService';
import { ProgressService } from '../../progress/services/progressService';

export class QuizService {
    private questionService: QuestionService;
    private scoringService: ScoringService;
    private progressService: ProgressService;

    constructor() {
        this.questionService = new QuestionService();
        this.scoringService = new ScoringService();
        this.progressService = new ProgressService();
    }

    async startGame(request: StartGameRequest): Promise<GameSession> {
        // Validate user
        const user = await db.query(
            'SELECT * FROM users WHERE id = $1 AND is_active = true',
            [request.userId]
        );
        
        if (!user.rows[0]) {
            throw new Error('User not found or inactive');
        }

        // Validate game mode
        if (request.gameMode === 'MULTI_PLAYER' && !request.opponentUserId) {
            throw new Error('Opponent user ID required for multiplayer');
        }

        // Check active games
        const activeGame = await db.query(
            `SELECT id FROM matches 
             WHERE user_id = $1 AND status = 'ACTIVE'`,
            [request.userId]
        );
        
        if (activeGame.rows.length > 0) {
            throw new Error('User already has an active game');
        }

        // Create session
        const sessionResult = await db.query(
            `INSERT INTO matches (
                user_id, category_id, difficulty, questions_count, 
                status, started_at
            ) VALUES ($1, $2, $3, $4, 'ACTIVE', CURRENT_TIMESTAMP)
            RETURNING *`,
            [
                request.userId,
                request.categoryId || null,
                request.difficulty || 'MIXED',
                request.questionsCount || 10
            ]
        );

        return sessionResult.rows[0];
    }

    async selectQuestionsForGame(
        sessionId: number,
        categoryId: number | null,
        difficulty: string,
        count: number
    ): Promise<Question[]> {
        // Get available questions
        const questions = await this.questionService.getRandomQuestions(
            categoryId,
            difficulty,
            count
        );

        if (questions.length < count) {
            throw new Error(`Not enough questions. Found: ${questions.length}, Required: ${count}`);
        }

        // Save to match_questions
        for (let i = 0; i < questions.length; i++) {
            await db.query(
                `INSERT INTO match_questions (match_id, question_id, question_order)
                 VALUES ($1, $2, $3)`,
                [sessionId, questions[i].id, i + 1]
            );
        }

        // Load options
        const questionsWithOptions = await Promise.all(
            questions.map(async (q) => ({
                ...q,
                options: await this.questionService.getQuestionOptions(q.id)
            }))
        );

        return questionsWithOptions;
    }

    async submitAnswer(
        sessionId: number,
        questionId: number,
        selectedOptionId: number,
        timeTaken: number
    ): Promise<AnswerResult> {
        // Validate session
        const session = await this.getSession(sessionId);
        if (!session || session.status !== 'ACTIVE') {
            throw new Error('Game session not active');
        }

        // Check if already answered
        const existing = await db.query(
            `SELECT id FROM user_answers 
             WHERE match_id = $1 AND question_id = $2`,
            [sessionId, questionId]
        );
        
        if (existing.rows.length > 0) {
            throw new Error('Question already answered');
        }

        // Get correct answer
        const correctOption = await db.query(
            `SELECT id FROM question_options 
             WHERE question_id = $1 AND is_correct = true`,
            [questionId]
        );

        if (!correctOption.rows[0]) {
            throw new Error('Correct answer not found');
        }

        const isCorrect = selectedOptionId === correctOption.rows[0].id;

        // Get question for scoring
        const question = await this.questionService.getQuestionById(questionId);

        // Calculate points
        const pointsEarned = isCorrect
            ? this.scoringService.calculatePoints(question, timeTaken)
            : 0;

        // Save answer
        const answerResult = await db.query(
            `INSERT INTO user_answers (
                match_id, question_id, selected_option_id,
                is_correct, time_taken, points_earned, answered_at
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            RETURNING *`,
            [sessionId, questionId, selectedOptionId, isCorrect, timeTaken, pointsEarned]
        );

        // Update session stats
        await this.updateSessionStats(sessionId, isCorrect, pointsEarned);

        // Update user XP if correct
        if (isCorrect) {
            const xpGained = this.scoringService.calculateXP(question, true, timeTaken);
            await this.progressService.addXP(session.user_id, xpGained);
        }

        return {
            answerId: answerResult.rows[0].id,
            isCorrect,
            correctOptionId: correctOption.rows[0].id,
            pointsEarned,
            explanation: question.explanation
        };
    }

    async endGame(sessionId: number): Promise<GameResult> {
        const session = await this.getSession(sessionId);
        
        if (session.status !== 'ACTIVE') {
            throw new Error('Game is not active');
        }

        // Calculate final stats
        const stats = await this.calculateFinalStats(sessionId);

        // Update user total score
        await db.query(
            `UPDATE users 
             SET total_score = total_score + $1 
             WHERE id = $2`,
            [stats.totalScore, session.user_id]
        );

        // Calculate time spent
        const timeSpent = Math.floor(
            (new Date().getTime() - session.started_at.getTime()) / 1000
        );

        // Mark as completed
        await db.query(
            `UPDATE matches 
             SET status = 'COMPLETED', ended_at = CURRENT_TIMESTAMP, time_spent = $1
             WHERE id = $2`,
            [timeSpent, sessionId]
        );

        // Update user stats
        await this.progressService.updateUserStats(
            session.user_id,
            session.category_id,
            stats
        );

        // Check achievements
        const achievements = await this.progressService.checkAchievements(session.user_id);

        return {
            sessionId,
            userId: session.user_id,
            totalScore: stats.totalScore,
            correctAnswers: stats.correctAnswers,
            wrongAnswers: stats.wrongAnswers,
            accuracy: stats.accuracy,
            timeSpent,
            newAchievements: achievements
        };
    }

    private async getSession(sessionId: number): Promise<GameSession | null> {
        const result = await db.query(
            'SELECT * FROM matches WHERE id = $1',
            [sessionId]
        );
        return result.rows[0] || null;
    }

    private async updateSessionStats(
        sessionId: number,
        isCorrect: boolean,
        pointsEarned: number
    ): Promise<void> {
        await db.query(
            `UPDATE matches 
             SET 
                total_score = total_score + $1,
                correct_answers = correct_answers + $2,
                wrong_answers = wrong_answers + $3
             WHERE id = $4`,
            [pointsEarned, isCorrect ? 1 : 0, isCorrect ? 0 : 1, sessionId]
        );
    }

    private async calculateFinalStats(sessionId: number): Promise<FinalStats> {
        const result = await db.query(
            `SELECT 
                COALESCE(SUM(points_earned), 0) as total_score,
                COUNT(CASE WHEN is_correct THEN 1 END) as correct_answers,
                COUNT(CASE WHEN NOT is_correct THEN 1 END) as wrong_answers,
                COALESCE(AVG(time_taken), 0) as average_time
             FROM user_answers
             WHERE match_id = $1`,
            [sessionId]
        );

        const row = result.rows[0];
        const totalAnswers = parseInt(row.correct_answers) + parseInt(row.wrong_answers);
        const accuracy = totalAnswers > 0
            ? (parseInt(row.correct_answers) / totalAnswers) * 100
            : 0;

        return {
            totalScore: parseFloat(row.total_score),
            correctAnswers: parseInt(row.correct_answers),
            wrongAnswers: parseInt(row.wrong_answers),
            accuracy: Math.round(accuracy * 100) / 100,
            averageTime: parseFloat(row.average_time)
        };
    }
}
```

---

## 2. Scoring Service

```typescript
// backend/src/modules/quiz/services/scoringService.ts

export class ScoringService {
    calculatePoints(question: Question, timeTaken: number): number {
        const basePoints = question.points;
        const difficultyMultiplier = this.getDifficultyMultiplier(question.difficulty);
        const timeBonus = this.calculateTimeBonus(timeTaken);

        return Math.round(basePoints * difficultyMultiplier * timeBonus);
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
        if (timeTaken <= 5) return 1.5;
        if (timeTaken <= 10) return 1.3;
        if (timeTaken <= 20) return 1.1;
        return 1.0;
    }

    calculateXP(question: Question, isCorrect: boolean, timeTaken: number): number {
        if (!isCorrect) return 0;

        const baseXP: Record<string, number> = {
            'EASY': 10,
            'MEDIUM': 20,
            'HARD': 30,
            'EXPERT': 50
        };

        const xp = baseXP[question.difficulty] || 10;
        const timeBonus = timeTaken < 5 ? 0.2 : 0;

        return Math.round(xp * (1 + timeBonus));
    }
}
```

---

## 3. Frontend - Quiz Component

```typescript
// frontend/src/components/quiz/QuizGame.tsx

import React, { useState, useEffect } from 'react';
import { QuestionCard } from './QuestionCard';
import { QuizTimer } from './QuizTimer';
import { ScoreDisplay } from './ScoreDisplay';
import { quizApi } from '../../services/api/quizApi';

interface QuizGameProps {
    sessionId: number;
    onGameEnd: (result: GameResult) => void;
}

export const QuizGame: React.FC<QuizGameProps> = ({ sessionId, onGameEnd }) => {
    const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
    const [score, setScore] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(30);
    const [isAnswering, setIsAnswering] = useState(false);
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadNextQuestion();
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [sessionId]);

    const loadNextQuestion = async () => {
        try {
            const question = await quizApi.getCurrentQuestion(sessionId);
            if (!question) {
                // No more questions, end game
                endGame();
                return;
            }
            
            setCurrentQuestion(question);
            setTimeRemaining(30);
            startTimer();
        } catch (error) {
            console.error('Error loading question:', error);
        }
    };

    const startTimer = () => {
        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        setTimer(interval);
    };

    const handleTimeout = async () => {
        if (!currentQuestion || isAnswering) return;
        
        setIsAnswering(true);
        
        try {
            await quizApi.handleTimeout(sessionId, currentQuestion.questionId);
            await loadNextQuestion();
        } catch (error) {
            console.error('Error handling timeout:', error);
        } finally {
            setIsAnswering(false);
        }
    };

    const handleAnswer = async (selectedOptionId: number) => {
        if (!currentQuestion || isAnswering) return;
        
        setIsAnswering(true);
        
        if (timer) {
            clearInterval(timer);
            setTimer(null);
        }
        
        const timeTaken = 30 - timeRemaining;
        const startTime = Date.now();
        
        try {
            const result = await quizApi.submitAnswer(
                sessionId,
                currentQuestion.questionId,
                selectedOptionId,
                timeTaken
            );
            
            // Update score
            setScore((prev) => prev + result.pointsEarned);
            
            // Show result briefly
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Load next question
            await loadNextQuestion();
        } catch (error) {
            console.error('Error submitting answer:', error);
        } finally {
            setIsAnswering(false);
        }
    };

    const endGame = async () => {
        try {
            const result = await quizApi.endGame(sessionId);
            onGameEnd(result);
        } catch (error) {
            console.error('Error ending game:', error);
        }
    };

    if (!currentQuestion) {
        return <div>Loading...</div>;
    }

    return (
        <div className="quiz-game">
            <ScoreDisplay score={score} />
            <QuizTimer timeRemaining={timeRemaining} />
            <QuestionCard
                question={currentQuestion}
                onAnswer={handleAnswer}
                disabled={isAnswering}
            />
            <div className="progress">
                Question {currentQuestion.questionNumber} of {currentQuestion.totalQuestions}
            </div>
        </div>
    );
};
```

---

## 4. Frontend - Timer Component

```typescript
// frontend/src/components/quiz/QuizTimer.tsx

import React, { useEffect, useState } from 'react';

interface QuizTimerProps {
    timeRemaining: number;
    onTimeUp?: () => void;
}

export const QuizTimer: React.FC<QuizTimerProps> = ({ timeRemaining, onTimeUp }) => {
    const [isWarning, setIsWarning] = useState(false);

    useEffect(() => {
        if (timeRemaining <= 10) {
            setIsWarning(true);
        } else {
            setIsWarning(false);
        }

        if (timeRemaining === 0 && onTimeUp) {
            onTimeUp();
        }
    }, [timeRemaining, onTimeUp]);

    const percentage = (timeRemaining / 30) * 100;

    return (
        <div className="quiz-timer">
            <div className="timer-circle">
                <svg viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e0e0e0"
                        strokeWidth="8"
                    />
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={isWarning ? '#ff4444' : '#4caf50'}
                        strokeWidth="8"
                        strokeDasharray={`${percentage * 2.827} 282.7`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                        className="timer-progress"
                    />
                </svg>
                <div className="timer-text">
                    {timeRemaining}s
                </div>
            </div>
        </div>
    );
};
```

---

## 5. API Client

```typescript
// frontend/src/services/api/quizApi.ts

import { apiClient } from './client';

export const quizApi = {
    async startGame(request: StartGameRequest): Promise<GameSession> {
        const response = await apiClient.post('/api/game/start', request);
        return response.data;
    },

    async getCurrentQuestion(sessionId: number): Promise<CurrentQuestion | null> {
        const response = await apiClient.get(`/api/game/${sessionId}/question`);
        return response.data;
    },

    async submitAnswer(
        sessionId: number,
        questionId: number,
        selectedOptionId: number,
        timeTaken: number
    ): Promise<AnswerResult> {
        const response = await apiClient.post(`/api/game/${sessionId}/answer`, {
            questionId,
            selectedOptionId,
            timeTaken
        });
        return response.data;
    },

    async handleTimeout(sessionId: number, questionId: number): Promise<void> {
        await apiClient.post(`/api/game/${sessionId}/timeout`, { questionId });
    },

    async getProgress(sessionId: number): Promise<GameProgress> {
        const response = await apiClient.get(`/api/game/${sessionId}/progress`);
        return response.data;
    },

    async endGame(sessionId: number): Promise<GameResult> {
        const response = await apiClient.post(`/api/game/${sessionId}/end`);
        return response.data;
    }
};
```

---

## 6. Controller

```typescript
// backend/src/modules/quiz/controllers/quizController.ts

import { Request, Response } from 'express';
import { QuizService } from '../services/quizService';

export class QuizController {
    private quizService: QuizService;

    constructor() {
        this.quizService = new QuizService();
    }

    async startGame(req: Request, res: Response): Promise<void> {
        try {
            const session = await this.quizService.startGame(req.body);
            res.json({ success: true, data: session });
        } catch (error) {
            res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    async getCurrentQuestion(req: Request, res: Response): Promise<void> {
        try {
            const { sessionId } = req.params;
            const question = await this.quizService.getCurrentQuestion(
                parseInt(sessionId)
            );
            res.json({ success: true, data: question });
        } catch (error) {
            res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    async submitAnswer(req: Request, res: Response): Promise<void> {
        try {
            const { sessionId } = req.params;
            const { questionId, selectedOptionId, timeTaken } = req.body;
            
            const result = await this.quizService.submitAnswer(
                parseInt(sessionId),
                questionId,
                selectedOptionId,
                timeTaken
            );
            
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    async endGame(req: Request, res: Response): Promise<void> {
        try {
            const { sessionId } = req.params;
            const result = await this.quizService.endGame(parseInt(sessionId));
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }
    }
}
```

---

## 7. Routes

```typescript
// backend/src/modules/quiz/routes/quizRoutes.ts

import { Router } from 'express';
import { QuizController } from '../controllers/quizController';
import { authMiddleware } from '../../../shared/middleware/auth';

const router = Router();
const quizController = new QuizController();

router.post('/start', authMiddleware, (req, res) => 
    quizController.startGame(req, res)
);

router.get('/:sessionId/question', authMiddleware, (req, res) => 
    quizController.getCurrentQuestion(req, res)
);

router.post('/:sessionId/answer', authMiddleware, (req, res) => 
    quizController.submitAnswer(req, res)
);

router.post('/:sessionId/timeout', authMiddleware, (req, res) => 
    quizController.handleTimeout(req, res)
);

router.post('/:sessionId/end', authMiddleware, (req, res) => 
    quizController.endGame(req, res)
);

export default router;
```

---

این مثال‌ها نشان می‌دهند که چگونه منطق بازی را در کد واقعی پیاده‌سازی کنید.

