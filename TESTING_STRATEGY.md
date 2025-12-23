# استراتژی تست بازی Quiz - طراحی کامل

این سند شامل طراحی کامل تست‌ها برای بازی Quiz شامل Unit Test، Integration Test، تست منطق بازی و تست امنیت است.

---

## 📋 فهرست

1. [ساختار تست‌ها](#1-ساختار-تست‌ها)
2. [Unit Tests](#2-unit-tests)
3. [Integration Tests](#3-integration-tests)
4. [تست منطق بازی](#4-تست-منطق-بازی)
5. [تست امنیت](#5-تست-امنیت)
6. [Setup و Configuration](#6-setup-و-configuration)
7. [Test Coverage](#7-test-coverage)

---

## 1. ساختار تست‌ها

### 1.1. ساختار پوشه‌ها

```
backend/
├── src/
└── tests/
    ├── unit/
    │   ├── services/
    │   │   ├── quizService.test.ts
    │   │   ├── scoringService.test.ts
    │   │   ├── userService.test.ts
    │   │   └── matchmakingService.test.ts
    │   ├── repositories/
    │   │   ├── quizSessionRepository.test.ts
    │   │   └── userRepository.test.ts
    │   ├── controllers/
    │   │   ├── quizController.test.ts
    │   │   └── authController.test.ts
    │   └── utils/
    │       └── validators.test.ts
    ├── integration/
    │   ├── api/
    │   │   ├── auth.test.ts
    │   │   ├── quiz.test.ts
    │   │   └── game.test.ts
    │   └── database/
    │       └── transactions.test.ts
    ├── e2e/
    │   ├── game-flow.test.ts
    │   └── multiplayer-flow.test.ts
    ├── security/
    │   ├── authentication.test.ts
    │   ├── authorization.test.ts
    │   └── input-validation.test.ts
    ├── fixtures/
    │   ├── users.ts
    │   ├── questions.ts
    │   └── matches.ts
    ├── helpers/
    │   ├── testDatabase.ts
    │   ├── testClient.ts
    │   └── mocks.ts
    └── setup/
        ├── jest.config.ts
        └── testSetup.ts
```

### 1.2. Dependencies

```json
{
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/supertest": "^2.0.12",
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.0",
    "jest-mock-extended": "^3.0.5",
    "@faker-js/faker": "^8.0.0",
    "nock": "^13.3.0"
  }
}
```

---

## 2. Unit Tests

### 2.1. Quiz Service Tests

```typescript
// backend/tests/unit/services/quizService.test.ts

import { QuizService } from '../../../src/modules/quiz/services/quizService';
import { QuizSessionRepository } from '../../../src/modules/quiz/repositories/quizSessionRepository';
import { UserAnswerRepository } from '../../../src/modules/quiz/repositories/userAnswerRepository';
import { QuestionService } from '../../../src/modules/questions/services/questionService';
import { ScoringService } from '../../../src/modules/scoring/services/scoringService';
import { mock, MockProxy } from 'jest-mock-extended';

describe('QuizService', () => {
    let quizService: QuizService;
    let sessionRepository: MockProxy<QuizSessionRepository>;
    let answerRepository: MockProxy<UserAnswerRepository>;
    let questionService: MockProxy<QuestionService>;
    let scoringService: MockProxy<ScoringService>;

    beforeEach(() => {
        sessionRepository = mock<QuizSessionRepository>();
        answerRepository = mock<UserAnswerRepository>();
        questionService = mock<QuestionService>();
        scoringService = mock<ScoringService>();

        quizService = new QuizService(
            sessionRepository,
            answerRepository,
            questionService,
            scoringService
        );
    });

    describe('startGame', () => {
        it('should create a single player game session', async () => {
            // Arrange
            const userId = 1;
            const dto = {
                gameMode: 'SINGLE_PLAYER' as const,
                categoryId: 1,
                difficulty: 'MEDIUM' as const,
                questionsCount: 10
            };

            const mockSession = {
                id: 1,
                user_id: userId,
                category_id: 1,
                difficulty: 'MEDIUM',
                questions_count: 10,
                status: 'ACTIVE',
                started_at: new Date(),
                ended_at: null,
                total_score: 0,
                correct_answers: 0,
                wrong_answers: 0,
                time_spent: null,
                is_practice: false,
                game_mode: 'SINGLE_PLAYER',
                created_at: new Date()
            };

            const mockQuestions = Array.from({ length: 10 }, (_, i) => ({
                id: i + 1,
                question_text: `Question ${i + 1}`,
                category_id: 1,
                difficulty: 'MEDIUM',
                points: 10,
                explanation: 'Explanation',
                options: []
            }));

            sessionRepository.findByUserId.mockResolvedValue([]);
            sessionRepository.create.mockResolvedValue(mockSession);
            questionService.getRandomQuestions.mockResolvedValue(mockQuestions);
            sessionRepository.addMatchQuestion.mockResolvedValue(undefined);

            // Act
            const result = await quizService.startGame(userId, dto);

            // Assert
            expect(result).toEqual(mockSession);
            expect(sessionRepository.create).toHaveBeenCalledWith({
                userId,
                categoryId: 1,
                difficulty: 'MEDIUM',
                questionsCount: 10,
                gameMode: 'SINGLE_PLAYER',
                isPractice: false
            });
            expect(questionService.getRandomQuestions).toHaveBeenCalledWith({
                categoryId: 1,
                difficulty: 'MEDIUM',
                count: 10
            });
            expect(sessionRepository.addMatchQuestion).toHaveBeenCalledTimes(10);
        });

        it('should throw error if user has active game', async () => {
            // Arrange
            const userId = 1;
            const dto = {
                gameMode: 'SINGLE_PLAYER' as const,
                questionsCount: 10
            };

            const activeSession = {
                id: 1,
                user_id: userId,
                status: 'ACTIVE'
            } as any;

            sessionRepository.findByUserId.mockResolvedValue([activeSession]);

            // Act & Assert
            await expect(quizService.startGame(userId, dto)).rejects.toThrow(
                'User already has an active game'
            );
        });

        it('should allow multiple practice sessions', async () => {
            // Arrange
            const userId = 1;
            const dto = {
                gameMode: 'PRACTICE' as const,
                questionsCount: 10
            };

            const activePracticeSession = {
                id: 1,
                user_id: userId,
                status: 'ACTIVE',
                is_practice: true
            } as any;

            sessionRepository.findByUserId.mockResolvedValue([activePracticeSession]);
            sessionRepository.create.mockResolvedValue({
                id: 2,
                user_id: userId,
                status: 'ACTIVE',
                is_practice: true
            } as any);
            questionService.getRandomQuestions.mockResolvedValue([]);

            // Act
            const result = await quizService.startGame(userId, dto);

            // Assert
            expect(result).toBeDefined();
            expect(result.is_practice).toBe(true);
        });
    });

    describe('submitAnswer', () => {
        it('should submit answer and calculate points correctly', async () => {
            // Arrange
            const sessionId = 1;
            const userId = 1;
            const dto = {
                questionId: 1,
                selectedOptionId: 2,
                timeTaken: 15
            };

            const mockSession = {
                id: sessionId,
                user_id: userId,
                status: 'ACTIVE',
                is_practice: false
            } as any;

            const mockQuestion = {
                id: 1,
                question_text: 'Test question',
                options: [
                    { id: 1, option_text: 'Option 1', is_correct: false },
                    { id: 2, option_text: 'Option 2', is_correct: true },
                    { id: 3, option_text: 'Option 3', is_correct: false },
                    { id: 4, option_text: 'Option 4', is_correct: false }
                ]
            };

            sessionRepository.findById.mockResolvedValue(mockSession);
            answerRepository.findByMatchAndQuestion.mockResolvedValue(null);
            sessionRepository.getMatchQuestions.mockResolvedValue([
                { question_id: 1, question_order: 1 }
            ]);
            questionService.getQuestionById.mockResolvedValue(mockQuestion);
            scoringService.calculatePoints.mockReturnValue(50);
            answerRepository.create.mockResolvedValue({
                id: 1,
                match_id: sessionId,
                question_id: 1,
                is_correct: true,
                points_earned: 50
            } as any);
            sessionRepository.update.mockResolvedValue(mockSession);

            // Act
            const result = await quizService.submitAnswer(sessionId, userId, dto);

            // Assert
            expect(result.isCorrect).toBe(true);
            expect(result.pointsEarned).toBe(50);
            expect(answerRepository.create).toHaveBeenCalledWith({
                matchId: sessionId,
                questionId: 1,
                selectedOptionId: 2,
                userAnswerText: null,
                isCorrect: true,
                timeTaken: 15,
                pointsEarned: 50
            });
        });

        it('should not award points in practice mode', async () => {
            // Arrange
            const sessionId = 1;
            const userId = 1;
            const dto = {
                questionId: 1,
                selectedOptionId: 2,
                timeTaken: 15
            };

            const mockSession = {
                id: sessionId,
                user_id: userId,
                status: 'ACTIVE',
                is_practice: true
            } as any;

            const mockQuestion = {
                id: 1,
                options: [
                    { id: 1, is_correct: false },
                    { id: 2, is_correct: true }
                ]
            };

            sessionRepository.findById.mockResolvedValue(mockSession);
            answerRepository.findByMatchAndQuestion.mockResolvedValue(null);
            sessionRepository.getMatchQuestions.mockResolvedValue([
                { question_id: 1 }
            ]);
            questionService.getQuestionById.mockResolvedValue(mockQuestion);
            answerRepository.create.mockResolvedValue({
                id: 1,
                points_earned: 0
            } as any);

            // Act
            const result = await quizService.submitAnswer(sessionId, userId, dto);

            // Assert
            expect(result.pointsEarned).toBe(0);
            expect(scoringService.calculatePoints).not.toHaveBeenCalled();
        });

        it('should throw error if question already answered', async () => {
            // Arrange
            const sessionId = 1;
            const userId = 1;
            const dto = {
                questionId: 1,
                selectedOptionId: 2,
                timeTaken: 15
            };

            const mockSession = {
                id: sessionId,
                user_id: userId,
                status: 'ACTIVE'
            } as any;

            const existingAnswer = {
                id: 1,
                match_id: sessionId,
                question_id: 1
            } as any;

            sessionRepository.findById.mockResolvedValue(mockSession);
            answerRepository.findByMatchAndQuestion.mockResolvedValue(existingAnswer);

            // Act & Assert
            await expect(
                quizService.submitAnswer(sessionId, userId, dto)
            ).rejects.toThrow('Question already answered');
        });
    });

    describe('endGame', () => {
        it('should end game and calculate final stats', async () => {
            // Arrange
            const sessionId = 1;
            const userId = 1;

            const mockSession = {
                id: sessionId,
                user_id: userId,
                status: 'ACTIVE',
                started_at: new Date(Date.now() - 60000), // 1 minute ago
                is_practice: false
            } as any;

            const mockAnswers = [
                { is_correct: true, points_earned: 50, time_taken: 10 },
                { is_correct: true, points_earned: 40, time_taken: 15 },
                { is_correct: false, points_earned: 0, time_taken: 20 }
            ] as any;

            sessionRepository.findById.mockResolvedValue(mockSession);
            answerRepository.getMatchAnswers.mockResolvedValue(mockAnswers);
            sessionRepository.update.mockResolvedValue({
                ...mockSession,
                status: 'COMPLETED'
            });

            // Act
            const result = await quizService.endGame(sessionId, userId);

            // Assert
            expect(result.status).toBe('COMPLETED');
            expect(result.totalScore).toBe(90);
            expect(result.correctAnswers).toBe(2);
            expect(result.wrongAnswers).toBe(1);
            expect(result.accuracy).toBeCloseTo(66.67, 2);
        });
    });
});
```

### 2.2. Scoring Service Tests

```typescript
// backend/tests/unit/services/scoringService.test.ts

import { ScoringService } from '../../../src/modules/scoring/services/scoringService';

describe('ScoringService', () => {
    let scoringService: ScoringService;

    beforeEach(() => {
        scoringService = new ScoringService();
    });

    describe('calculatePoints', () => {
        it('should calculate points correctly for easy question', () => {
            // Arrange
            const question = {
                id: 1,
                difficulty: 'EASY',
                points: 10
            } as any;
            const timeTaken = 15; // 15 seconds
            const isCorrect = true;

            // Act
            const points = scoringService.calculatePoints(question, timeTaken, isCorrect);

            // Assert
            // Base: 10, Difficulty multiplier: 1.0, Time bonus: 1.5 (15s < 20s)
            // Expected: 10 * 1.0 * 1.5 = 15
            expect(points).toBe(15);
        });

        it('should calculate points correctly for hard question', () => {
            // Arrange
            const question = {
                id: 1,
                difficulty: 'HARD',
                points: 20
            } as any;
            const timeTaken = 10;
            const isCorrect = true;

            // Act
            const points = scoringService.calculatePoints(question, timeTaken, isCorrect);

            // Assert
            // Base: 20, Difficulty multiplier: 2.0, Time bonus: 2.0 (10s < 15s)
            // Expected: 20 * 2.0 * 2.0 = 80
            expect(points).toBe(80);
        });

        it('should return 0 for incorrect answer', () => {
            // Arrange
            const question = {
                id: 1,
                difficulty: 'MEDIUM',
                points: 15
            } as any;
            const timeTaken = 5;
            const isCorrect = false;

            // Act
            const points = scoringService.calculatePoints(question, timeTaken, isCorrect);

            // Assert
            expect(points).toBe(0);
        });

        it('should apply time penalty for slow answers', () => {
            // Arrange
            const question = {
                id: 1,
                difficulty: 'MEDIUM',
                points: 15
            } as any;
            const timeTaken = 28; // Close to time limit
            const isCorrect = true;

            // Act
            const points = scoringService.calculatePoints(question, timeTaken, isCorrect);

            // Assert
            // Time bonus should be less than 1.0 for slow answers
            expect(points).toBeLessThan(15);
        });
    });

    describe('calculateXP', () => {
        it('should calculate XP based on question difficulty and time', () => {
            // Arrange
            const question = {
                id: 1,
                difficulty: 'MEDIUM'
            } as any;
            const isCorrect = true;
            const timeTaken = 12;

            // Act
            const xp = scoringService.calculateXP(question, isCorrect, timeTaken);

            // Assert
            // Base XP for MEDIUM: 15, Time bonus: 1.2
            // Expected: 15 * 1.2 = 18
            expect(xp).toBe(18);
        });

        it('should return 0 XP for incorrect answer', () => {
            // Arrange
            const question = {
                id: 1,
                difficulty: 'HARD'
            } as any;
            const isCorrect = false;
            const timeTaken = 10;

            // Act
            const xp = scoringService.calculateXP(question, isCorrect, timeTaken);

            // Assert
            expect(xp).toBe(0);
        });
    });

    describe('calculateLevel', () => {
        it('should calculate level correctly', () => {
            // Act & Assert
            expect(scoringService.calculateLevel(0)).toBe(1);
            expect(scoringService.calculateLevel(100)).toBe(2);
            expect(scoringService.calculateLevel(300)).toBe(3);
            expect(scoringService.calculateLevel(600)).toBe(4);
            expect(scoringService.calculateLevel(1000)).toBe(5);
        });

        it('should handle high XP values', () => {
            // Act
            const level = scoringService.calculateLevel(10000);

            // Assert
            expect(level).toBeGreaterThan(10);
        });
    });
});
```

### 2.3. Repository Tests

```typescript
// backend/tests/unit/repositories/quizSessionRepository.test.ts

import { QuizSessionRepository } from '../../../src/modules/quiz/repositories/quizSessionRepository';
import { db } from '../../../src/shared/database/connection';

jest.mock('../../../src/shared/database/connection');

describe('QuizSessionRepository', () => {
    let repository: QuizSessionRepository;
    let mockQuery: jest.Mock;

    beforeEach(() => {
        repository = new QuizSessionRepository();
        mockQuery = jest.fn();
        (db.query as jest.Mock) = mockQuery;
    });

    describe('create', () => {
        it('should create a new session', async () => {
            // Arrange
            const sessionData = {
                userId: 1,
                categoryId: 1,
                difficulty: 'MEDIUM',
                questionsCount: 10,
                gameMode: 'SINGLE_PLAYER',
                isPractice: false
            };

            const mockResult = {
                rows: [{
                    id: 1,
                    user_id: 1,
                    category_id: 1,
                    difficulty: 'MEDIUM',
                    questions_count: 10,
                    status: 'ACTIVE',
                    is_practice: false,
                    game_mode: 'SINGLE_PLAYER',
                    created_at: new Date()
                }]
            };

            mockQuery.mockResolvedValue(mockResult);

            // Act
            const result = await repository.create(sessionData);

            // Assert
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO matches'),
                expect.arrayContaining([1, 1, 'MEDIUM', 10, false, 'SINGLE_PLAYER'])
            );
            expect(result.id).toBe(1);
            expect(result.user_id).toBe(1);
        });
    });

    describe('findById', () => {
        it('should find session by id', async () => {
            // Arrange
            const sessionId = 1;
            const mockResult = {
                rows: [{
                    id: 1,
                    user_id: 1,
                    status: 'ACTIVE'
                }]
            };

            mockQuery.mockResolvedValue(mockResult);

            // Act
            const result = await repository.findById(sessionId);

            // Assert
            expect(mockQuery).toHaveBeenCalledWith(
                'SELECT * FROM matches WHERE id = $1',
                [sessionId]
            );
            expect(result).toEqual(mockResult.rows[0]);
        });

        it('should return null if not found', async () => {
            // Arrange
            mockQuery.mockResolvedValue({ rows: [] });

            // Act
            const result = await repository.findById(999);

            // Assert
            expect(result).toBeNull();
        });
    });
});
```

---

## 3. Integration Tests

### 3.1. Auth API Tests

```typescript
// backend/tests/integration/api/auth.test.ts

import request from 'supertest';
import { app } from '../../../src/app';
import { db } from '../../../src/shared/database/connection';
import { hashPassword } from '../../../src/shared/utils/password';

describe('Auth API', () => {
    beforeAll(async () => {
        // Setup test database
        await db.query('TRUNCATE TABLE users CASCADE');
    });

    afterAll(async () => {
        await db.query('TRUNCATE TABLE users CASCADE');
        await db.end();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            // Arrange
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test1234!'
            };

            // Act
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            // Assert
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('token');
            expect(response.body.user.email).toBe(userData.email);
            expect(response.body.user.password).toBeUndefined();
        });

        it('should reject duplicate email', async () => {
            // Arrange
            const userData = {
                username: 'testuser2',
                email: 'test@example.com',
                password: 'Test1234!'
            };

            // Act & Assert
            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);
        });

        it('should validate password strength', async () => {
            // Arrange
            const userData = {
                username: 'testuser3',
                email: 'test3@example.com',
                password: 'weak' // Too weak
            };

            // Act & Assert
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.error).toContain('password');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create test user
            const passwordHash = await hashPassword('Test1234!');
            await db.query(
                'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
                ['logintest', 'login@example.com', passwordHash]
            );
        });

        it('should login with correct credentials', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'Test1234!'
                })
                .expect(200);

            // Assert
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
        });

        it('should reject incorrect password', async () => {
            // Act & Assert
            await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'WrongPassword!'
                })
                .expect(401);
        });

        it('should reject non-existent user', async () => {
            // Act & Assert
            await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Test1234!'
                })
                .expect(401);
        });
    });
});
```

### 3.2. Quiz API Tests

```typescript
// backend/tests/integration/api/quiz.test.ts

import request from 'supertest';
import { app } from '../../../src/app';
import { db } from '../../../src/shared/database/connection';
import { createTestUser, createTestToken } from '../../helpers/testHelpers';
import { createTestQuestions } from '../../fixtures/questions';

describe('Quiz API', () => {
    let authToken: string;
    let userId: number;

    beforeAll(async () => {
        // Create test user and get token
        const user = await createTestUser();
        userId = user.id;
        authToken = createTestToken(user.id);

        // Create test questions
        await createTestQuestions();
    });

    afterAll(async () => {
        await db.query('TRUNCATE TABLE matches, match_questions, user_answers CASCADE');
        await db.query('TRUNCATE TABLE questions, question_options CASCADE');
    });

    describe('POST /api/quiz/start', () => {
        it('should start a single player game', async () => {
            // Act
            const response = await request(app)
                .post('/api/quiz/start')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    gameMode: 'SINGLE_PLAYER',
                    categoryId: 1,
                    difficulty: 'MEDIUM',
                    questionsCount: 5
                })
                .expect(201);

            // Assert
            expect(response.body).toHaveProperty('sessionId');
            expect(response.body).toHaveProperty('status', 'ACTIVE');
            expect(response.body).toHaveProperty('questionsCount', 5);
        });

        it('should require authentication', async () => {
            // Act & Assert
            await request(app)
                .post('/api/quiz/start')
                .send({
                    gameMode: 'SINGLE_PLAYER'
                })
                .expect(401);
        });
    });

    describe('GET /api/quiz/:sessionId/current-question', () => {
        let sessionId: number;

        beforeEach(async () => {
            // Create a game session
            const response = await request(app)
                .post('/api/quiz/start')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    gameMode: 'SINGLE_PLAYER',
                    questionsCount: 5
                });

            sessionId = response.body.sessionId;
        });

        it('should get current question', async () => {
            // Act
            const response = await request(app)
                .get(`/api/quiz/${sessionId}/current-question`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Assert
            expect(response.body).toHaveProperty('questionId');
            expect(response.body).toHaveProperty('questionText');
            expect(response.body).toHaveProperty('options');
            expect(response.body.options).toHaveLength(4);
            expect(response.body).toHaveProperty('timeLimit', 30);
        });

        it('should not allow access to other user\'s session', async () => {
            // Arrange - Create another user
            const otherUser = await createTestUser();
            const otherToken = createTestToken(otherUser.id);

            // Act & Assert
            await request(app)
                .get(`/api/quiz/${sessionId}/current-question`)
                .set('Authorization', `Bearer ${otherToken}`)
                .expect(403);
        });
    });

    describe('POST /api/quiz/:sessionId/answer', () => {
        let sessionId: number;
        let questionId: number;

        beforeEach(async () => {
            // Create game and get question
            const startResponse = await request(app)
                .post('/api/quiz/start')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    gameMode: 'SINGLE_PLAYER',
                    questionsCount: 5
                });

            sessionId = startResponse.body.sessionId;

            const questionResponse = await request(app)
                .get(`/api/quiz/${sessionId}/current-question`)
                .set('Authorization', `Bearer ${authToken}`);

            questionId = questionResponse.body.questionId;
        });

        it('should submit answer correctly', async () => {
            // Arrange
            const questionResponse = await request(app)
                .get(`/api/quiz/${sessionId}/current-question`)
                .set('Authorization', `Bearer ${authToken}`);

            const correctOption = questionResponse.body.options.find(
                (opt: any) => opt.isCorrect
            );

            // Act
            const response = await request(app)
                .post(`/api/quiz/${sessionId}/answer`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    questionId: questionId,
                    selectedOptionId: correctOption.id,
                    timeTaken: 15
                })
                .expect(200);

            // Assert
            expect(response.body).toHaveProperty('isCorrect', true);
            expect(response.body).toHaveProperty('pointsEarned');
            expect(response.body.pointsEarned).toBeGreaterThan(0);
        });

        it('should reject answer for wrong question', async () => {
            // Act & Assert
            await request(app)
                .post(`/api/quiz/${sessionId}/answer`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    questionId: 99999, // Non-existent question
                    selectedOptionId: 1,
                    timeTaken: 15
                })
                .expect(400);
        });
    });
});
```

---

## 4. تست منطق بازی

### 4.1. Game Flow Tests

```typescript
// backend/tests/e2e/game-flow.test.ts

import { QuizService } from '../../src/modules/quiz/services/quizService';
import { createTestUser, createTestQuestions } from '../helpers/testHelpers';

describe('Game Flow', () => {
    let quizService: QuizService;
    let userId: number;

    beforeAll(async () => {
        quizService = new QuizService(/* ... */);
        const user = await createTestUser();
        userId = user.id;
        await createTestQuestions();
    });

    it('should complete a full single player game', async () => {
        // 1. Start game
        const session = await quizService.startGame(userId, {
            gameMode: 'SINGLE_PLAYER',
            questionsCount: 5
        });

        expect(session.status).toBe('ACTIVE');

        let totalScore = 0;
        let correctAnswers = 0;

        // 2. Answer all questions
        for (let i = 0; i < 5; i++) {
            const question = await quizService.getCurrentQuestion(session.id, userId);
            expect(question).not.toBeNull();

            // Get correct answer
            const correctOption = question!.options.find((opt: any) => opt.isCorrect);

            const result = await quizService.submitAnswer(session.id, userId, {
                questionId: question!.questionId,
                selectedOptionId: correctOption.id,
                timeTaken: 10
            });

            if (result.isCorrect) {
                correctAnswers++;
                totalScore += result.pointsEarned;
            }
        }

        // 3. End game
        const finalResult = await quizService.endGame(session.id, userId);

        // Assert
        expect(finalResult.status).toBe('COMPLETED');
        expect(finalResult.correctAnswers).toBe(correctAnswers);
        expect(finalResult.totalScore).toBe(totalScore);
        expect(finalResult.accuracy).toBe(100); // All correct
    });

    it('should handle timeout correctly', async () => {
        // Arrange
        const session = await quizService.startGame(userId, {
            gameMode: 'SINGLE_PLAYER',
            questionsCount: 1
        });

        const question = await quizService.getCurrentQuestion(session.id, userId);

        // Act - Simulate timeout
        await quizService.handleTimeout(session.id, question!.questionId);

        // Assert
        const answers = await quizService.getAnswers(session.id);
        expect(answers).toHaveLength(1);
        expect(answers[0].is_correct).toBe(false);
        expect(answers[0].points_earned).toBe(0);
    });

    it('should prevent answering same question twice', async () => {
        // Arrange
        const session = await quizService.startGame(userId, {
            gameMode: 'SINGLE_PLAYER',
            questionsCount: 1
        });

        const question = await quizService.getCurrentQuestion(session.id, userId);
        const correctOption = question!.options.find((opt: any) => opt.isCorrect);

        // Act - Answer first time
        await quizService.submitAnswer(session.id, userId, {
            questionId: question!.questionId,
            selectedOptionId: correctOption.id,
            timeTaken: 10
        });

        // Assert - Try to answer again
        await expect(
            quizService.submitAnswer(session.id, userId, {
                questionId: question!.questionId,
                selectedOptionId: correctOption.id,
                timeTaken: 10
            })
        ).rejects.toThrow('Question already answered');
    });
});
```

### 4.2. Multiplayer Flow Tests

```typescript
// backend/tests/e2e/multiplayer-flow.test.ts

describe('Multiplayer Game Flow', () => {
    let player1Id: number;
    let player2Id: number;
    let matchId: number;

    beforeAll(async () => {
        const user1 = await createTestUser();
        const user2 = await createTestUser();
        player1Id = user1.id;
        player2Id = user2.id;
        await createTestQuestions();
    });

    it('should complete a multiplayer match', async () => {
        // 1. Create match
        const match = await matchmakingService.createMatch({
            player1Id,
            player2Id,
            questionsCount: 5
        });
        matchId = match.id;

        // 2. Both players ready
        await gameService.setPlayerReady(matchId, player1Id);
        await gameService.setPlayerReady(matchId, player2Id);

        // 3. Start game
        await gameService.startMatch(matchId);

        // 4. Both players answer questions
        for (let i = 0; i < 5; i++) {
            const question1 = await gameService.getCurrentQuestion(matchId, player1Id);
            const question2 = await gameService.getCurrentQuestion(matchId, player2Id);

            // Both get same question
            expect(question1.questionId).toBe(question2.questionId);

            // Player 1 answers
            const correctOption1 = question1.options.find((opt: any) => opt.isCorrect);
            await gameService.submitAnswer(matchId, player1Id, {
                questionId: question1.questionId,
                selectedOptionId: correctOption1.id,
                timeTaken: 10
            });

            // Player 2 answers
            const correctOption2 = question2.options.find((opt: any) => opt.isCorrect);
            await gameService.submitAnswer(matchId, player2Id, {
                questionId: question2.questionId,
                selectedOptionId: correctOption2.id,
                timeTaken: 12
            });

            // Wait for question to complete
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 5. End match
        const result = await gameService.endMatch(matchId);

        // Assert
        expect(result.status).toBe('COMPLETED');
        expect(result.scores.player1).toBeGreaterThan(0);
        expect(result.scores.player2).toBeGreaterThan(0);
    });

    it('should handle player disconnection', async () => {
        // Arrange
        const match = await matchmakingService.createMatch({
            player1Id,
            player2Id,
            questionsCount: 3
        });

        await gameService.startMatch(match.id);

        // Act - Simulate disconnection
        await connectionManager.handleDisconnection(match.id, player1Id);

        // Assert
        const state = await gameService.getGameState(match.id);
        expect(state.player1.connectionState).toBe('DISCONNECTED');

        // Wait for timeout
        await new Promise(resolve => setTimeout(resolve, 31000));

        // Match should be ended
        const finalState = await gameService.getGameState(match.id);
        expect(finalState.status).toBe('COMPLETED');
        expect(finalState.winner).toBe(player2Id);
    });
});
```

---

## 5. تست امنیت

### 5.1. Authentication Tests

```typescript
// backend/tests/security/authentication.test.ts

import request from 'supertest';
import { app } from '../../src/app';

describe('Authentication Security', () => {
    describe('JWT Token', () => {
        it('should reject requests without token', async () => {
            await request(app)
                .get('/api/user/profile')
                .expect(401);
        });

        it('should reject invalid token', async () => {
            await request(app)
                .get('/api/user/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should reject expired token', async () => {
            // Create expired token
            const expiredToken = createExpiredToken();

            await request(app)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);
        });

        it('should accept valid token', async () => {
            const user = await createTestUser();
            const token = createTestToken(user.id);

            await request(app)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });
    });

    describe('Password Security', () => {
        it('should hash passwords before storing', async () => {
            const password = 'Test1234!';
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password
                });

            // Check database
            const user = await db.query(
                'SELECT password_hash FROM users WHERE email = $1',
                ['test@example.com']
            );

            expect(user.rows[0].password_hash).not.toBe(password);
            expect(user.rows[0].password_hash).toHaveLength(60); // bcrypt hash length
        });

        it('should not return password in response', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser2',
                    email: 'test2@example.com',
                    password: 'Test1234!'
                });

            expect(response.body.user).not.toHaveProperty('password');
            expect(response.body.user).not.toHaveProperty('password_hash');
        });
    });
});
```

### 5.2. Authorization Tests

```typescript
// backend/tests/security/authorization.test.ts

describe('Authorization Security', () => {
    it('should prevent access to other user\'s data', async () => {
        // Arrange
        const user1 = await createTestUser();
        const user2 = await createTestUser();
        const token1 = createTestToken(user1.id);

        // Create session for user1
        const session = await quizService.startGame(user1.id, {
            gameMode: 'SINGLE_PLAYER'
        });

        // Act & Assert - User2 tries to access user1's session
        await request(app)
            .get(`/api/quiz/${session.id}/current-question`)
            .set('Authorization', `Bearer ${token1}`)
            .expect(200); // Should work for user1

        const token2 = createTestToken(user2.id);
        await request(app)
            .get(`/api/quiz/${session.id}/current-question`)
            .set('Authorization', `Bearer ${token2}`)
            .expect(403); // Should fail for user2
    });

    it('should prevent unauthorized admin actions', async () => {
        // Arrange
        const regularUser = await createTestUser();
        const regularToken = createTestToken(regularUser.id);

        // Act & Assert
        await request(app)
            .delete('/api/admin/questions/1')
            .set('Authorization', `Bearer ${regularToken}`)
            .expect(403);
    });

    it('should allow admin actions for admin users', async () => {
        // Arrange
        const adminUser = await createAdminUser();
        const adminToken = createTestToken(adminUser.id);

        // Act & Assert
        await request(app)
            .delete('/api/admin/questions/1')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
    });
});
```

### 5.3. Input Validation Tests

```typescript
// backend/tests/security/input-validation.test.ts

describe('Input Validation Security', () => {
    describe('SQL Injection Prevention', () => {
        it('should prevent SQL injection in email field', async () => {
            const maliciousInput = "'; DROP TABLE users; --";

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: maliciousInput,
                    password: 'password'
                });

            // Should not execute SQL, just return error
            expect(response.status).toBe(400);
            
            // Verify users table still exists
            const result = await db.query('SELECT COUNT(*) FROM users');
            expect(result.rows[0].count).toBeDefined();
        });

        it('should prevent SQL injection in question text', async () => {
            const adminToken = createAdminToken();
            const maliciousInput = "'; DELETE FROM questions; --";

            const response = await request(app)
                .post('/api/admin/questions')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    questionText: maliciousInput,
                    categoryId: 1,
                    difficulty: 'MEDIUM',
                    options: []
                });

            // Should be sanitized or rejected
            expect([400, 422]).toContain(response.status);
        });
    });

    describe('XSS Prevention', () => {
        it('should sanitize user input in responses', async () => {
            const xssPayload = '<script>alert("XSS")</script>';

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: xssPayload,
                    email: 'test@example.com',
                    password: 'Test1234!'
                });

            // Username should be sanitized
            expect(response.body.user.username).not.toContain('<script>');
        });
    });

    describe('Rate Limiting', () => {
        it('should limit login attempts', async () => {
            const attempts = 6; // More than limit

            for (let i = 0; i < attempts; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: 'test@example.com',
                        password: 'WrongPassword'
                    });
            }

            // Should be rate limited
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'WrongPassword'
                });

            expect(response.status).toBe(429); // Too Many Requests
        });
    });

    describe('Data Type Validation', () => {
        it('should reject invalid data types', async () => {
            await request(app)
                .post('/api/quiz/start')
                .set('Authorization', `Bearer ${createTestToken(1)}`)
                .send({
                    gameMode: 'SINGLE_PLAYER',
                    questionsCount: 'not-a-number' // Should be number
                })
                .expect(400);
        });

        it('should reject out of range values', async () => {
            await request(app)
                .post('/api/quiz/start')
                .set('Authorization', `Bearer ${createTestToken(1)}`)
                .send({
                    gameMode: 'SINGLE_PLAYER',
                    questionsCount: 1000 // Too many
                })
                .expect(400);
        });
    });
});
```

---

## 6. Setup و Configuration

### 6.1. Jest Configuration

```typescript
// backend/tests/setup/jest.config.ts

export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/index.ts'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup/testSetup.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    }
};
```

### 6.2. Test Setup

```typescript
// backend/tests/setup/testSetup.ts

import { db } from '../../src/shared/database/connection';

beforeAll(async () => {
    // Connect to test database
    await db.connect();
});

afterAll(async () => {
    // Close database connection
    await db.end();
});

beforeEach(async () => {
    // Clean up test data
    await db.query('TRUNCATE TABLE matches, user_answers, match_questions CASCADE');
});

// Global test timeout
jest.setTimeout(10000);
```

### 6.3. Test Helpers

```typescript
// backend/tests/helpers/testHelpers.ts

import { db } from '../../src/shared/database/connection';
import { hashPassword } from '../../src/shared/utils/password';
import { generateToken } from '../../src/shared/utils/jwt';

export async function createTestUser(overrides?: Partial<User>): Promise<User> {
    const userData = {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'Test1234!',
        ...overrides
    };

    const passwordHash = await hashPassword(userData.password);
    
    const result = await db.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
        [userData.username, userData.email, passwordHash]
    );

    return result.rows[0];
}

export function createTestToken(userId: number): string {
    return generateToken({ userId, email: 'test@example.com' });
}

export async function createTestQuestions(count: number = 10): Promise<Question[]> {
    const questions = [];

    for (let i = 0; i < count; i++) {
        const questionResult = await db.query(
            'INSERT INTO questions (question_text, category_id, difficulty, points, explanation) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [
                `Test Question ${i + 1}?`,
                1,
                'MEDIUM',
                10,
                'Test explanation'
            ]
        );

        const question = questionResult.rows[0];

        // Create options
        const options = [
            { text: 'Option A', is_correct: false },
            { text: 'Option B', is_correct: true },
            { text: 'Option C', is_correct: false },
            { text: 'Option D', is_correct: false }
        ];

        for (let j = 0; j < options.length; j++) {
            await db.query(
                'INSERT INTO question_options (question_id, option_text, option_order, is_correct) VALUES ($1, $2, $3, $4)',
                [question.id, options[j].text, j + 1, options[j].is_correct]
            );
        }

        questions.push(question);
    }

    return questions;
}
```

---

## 7. Test Coverage

### 7.1. Coverage Goals

- **Unit Tests**: 80%+ coverage برای Services و Repositories
- **Integration Tests**: تمام API endpoints
- **E2E Tests**: تمام flow های اصلی بازی
- **Security Tests**: تمام نقاط امنیتی

### 7.2. Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- quizService.test.ts

# Watch mode
npm run test:watch
```

---

## خلاصه

این استراتژی تست شامل:

1. **Unit Tests**: تست Services، Repositories، Controllers
2. **Integration Tests**: تست API endpoints
3. **E2E Tests**: تست flow کامل بازی
4. **Security Tests**: تست Authentication، Authorization، Input Validation
5. **Setup & Configuration**: Jest config و test helpers

همه تست‌ها با مثال‌های واقعی کد ارائه شده‌اند و آماده استفاده هستند.

