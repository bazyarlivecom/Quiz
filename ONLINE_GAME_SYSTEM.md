# سیستم بازی آنلاین - طراحی کامل

این سند شامل طراحی کامل سیستم بازی آنلاین دو نفره و تک نفره با تمرکز روی Matchmaking، نوبت‌بندی، WebSocket و مدیریت قطع اتصال است.

---

## 📋 فهرست

1. [معماری کلی سیستم](#1-معماری-کلی-سیستم)
2. [Matchmaking System](#2-matchmaking-system)
3. [نوبت‌بندی بازیکنان](#3-نوبت‌بندی-بازیکنان)
4. [WebSocket Implementation](#4-websocket-implementation)
5. [مدیریت قطع اتصال](#5-مدیریت-قطع-اتصال)
6. [State Management](#6-state-management)
7. [Error Handling & Recovery](#7-error-handling--recovery)
8. [Scalability & Performance](#8-scalability--performance)

---

## 1. معماری کلی سیستم

### 1.1. معماری Real-time

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │◄───────►│  WebSocket   │◄───────►│   Redis     │
│  (Browser)   │         │   Server     │         │  (Pub/Sub)  │
└─────────────┘         └──────────────┘         └─────────────┘
                               │                         │
                               │                         │
                               ▼                         ▼
                        ┌──────────────┐         ┌─────────────┐
                        │   Database   │         │  Matchmaking│
                        │  PostgreSQL  │         │   Queue     │
                        └──────────────┘         └─────────────┘
```

### 1.2. کامپوننت‌های اصلی

1. **WebSocket Server**: مدیریت اتصالات Real-time
2. **Matchmaking Service**: جستجو و تطبیق بازیکنان
3. **Game Session Manager**: مدیریت وضعیت بازی‌ها
4. **Connection Manager**: مدیریت اتصالات و قطع اتصال
5. **Redis Pub/Sub**: همگام‌سازی بین چند سرور
6. **Database**: ذخیره‌سازی پایدار داده‌ها

---

## 2. Matchmaking System

### 2.1. الگوریتم Matchmaking

#### 2.1.1. Single Player Matchmaking

```typescript
// backend/src/modules/matchmaking/services/singlePlayerMatchmaking.ts

export class SinglePlayerMatchmaking {
    /**
     * ایجاد بازی تک نفره
     * - بدون نیاز به انتظار
     * - شروع فوری
     */
    async createMatch(userId: number, options: MatchOptions): Promise<GameSession> {
        // 1. بررسی بازی فعال
        const activeMatch = await this.checkActiveMatch(userId);
        if (activeMatch) {
            throw new Error('User already has an active match');
        }

        // 2. ایجاد سشن بازی
        const session = await this.gameSessionService.create({
            userId,
            gameMode: 'SINGLE_PLAYER',
            categoryId: options.categoryId,
            difficulty: options.difficulty,
            questionsCount: options.questionsCount || 10,
            status: 'WAITING'
        });

        // 3. انتخاب سوالات
        const questions = await this.questionService.getRandomQuestions({
            categoryId: options.categoryId,
            difficulty: options.difficulty,
            count: session.questions_count
        });

        // 4. ذخیره سوالات
        await this.saveMatchQuestions(session.id, questions);

        // 5. شروع بازی
        await this.startMatch(session.id);

        return session;
    }
}
```

#### 2.1.2. Multiplayer Matchmaking

```typescript
// backend/src/modules/matchmaking/services/multiplayerMatchmaking.ts

export interface MatchmakingQueue {
    userId: number;
    categoryId?: number;
    difficulty?: string;
    questionsCount?: number;
    eloRating?: number;
    joinedAt: Date;
    preferences: MatchPreferences;
}

export class MultiplayerMatchmaking {
    private queue: Map<number, MatchmakingQueue> = new Map();
    private matchingInterval: NodeJS.Timeout | null = null;

    /**
     * اضافه کردن بازیکن به صف
     */
    async joinQueue(userId: number, preferences: MatchPreferences): Promise<void> {
        // 1. بررسی بازی فعال
        const activeMatch = await this.checkActiveMatch(userId);
        if (activeMatch) {
            throw new Error('User already has an active match');
        }

        // 2. بررسی وجود در صف
        if (this.queue.has(userId)) {
            throw new Error('User already in queue');
        }

        // 3. دریافت اطلاعات کاربر
        const user = await this.userService.getById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // 4. اضافه به صف
        const queueEntry: MatchmakingQueue = {
            userId,
            categoryId: preferences.categoryId,
            difficulty: preferences.difficulty,
            questionsCount: preferences.questionsCount || 10,
            eloRating: user.elo_rating || 1000,
            joinedAt: new Date(),
            preferences
        };

        this.queue.set(userId, queueEntry);

        // 5. شروع فرآیند تطبیق (اگر در حال اجرا نیست)
        if (!this.matchingInterval) {
            this.startMatchingProcess();
        }

        // 6. ارسال به Redis برای همگام‌سازی
        await this.redis.publish('matchmaking:joined', {
            userId,
            preferences
        });
    }

    /**
     * حذف بازیکن از صف
     */
    async leaveQueue(userId: number): Promise<void> {
        if (!this.queue.has(userId)) {
            throw new Error('User not in queue');
        }

        this.queue.delete(userId);

        // ارسال به Redis
        await this.redis.publish('matchmaking:left', { userId });
    }

    /**
     * فرآیند تطبیق بازیکنان
     */
    private startMatchingProcess(): void {
        this.matchingInterval = setInterval(async () => {
            await this.matchPlayers();
        }, 2000); // هر 2 ثانیه یکبار
    }

    /**
     * تطبیق بازیکنان
     */
    private async matchPlayers(): Promise<void> {
        const players = Array.from(this.queue.values());

        if (players.length < 2) {
            return; // حداقل 2 بازیکن نیاز است
        }

        // گروه‌بندی بر اساس ترجیحات
        const groups = this.groupByPreferences(players);

        for (const group of groups) {
            if (group.length >= 2) {
                // تطبیق بر اساس ELO Rating
                const matched = this.matchByEloRating(group);

                if (matched.length >= 2) {
                    const [player1, player2] = matched;
                    await this.createMatch(player1, player2);
                }
            }
        }
    }

    /**
     * تطبیق بر اساس ELO Rating
     */
    private matchByEloRating(players: MatchmakingQueue[]): MatchmakingQueue[] {
        if (players.length < 2) {
            return [];
        }

        // مرتب‌سازی بر اساس ELO
        const sorted = players.sort((a, b) => a.eloRating! - b.eloRating!);

        // جستجوی نزدیک‌ترین ELO
        let bestMatch: MatchmakingQueue[] = [];
        let minEloDiff = Infinity;

        for (let i = 0; i < sorted.length - 1; i++) {
            const player1 = sorted[i];
            const player2 = sorted[i + 1];
            const eloDiff = Math.abs(player1.eloRating! - player2.eloRating!);

            // حداکثر اختلاف ELO: 200
            if (eloDiff <= 200 && eloDiff < minEloDiff) {
                minEloDiff = eloDiff;
                bestMatch = [player1, player2];
            }
        }

        // اگر اختلاف ELO زیاد است، باز کردن محدوده
        if (bestMatch.length === 0 && sorted.length >= 2) {
            // افزایش تدریجی محدوده ELO
            for (let maxDiff = 300; maxDiff <= 500; maxDiff += 100) {
                for (let i = 0; i < sorted.length - 1; i++) {
                    const player1 = sorted[i];
                    const player2 = sorted[i + 1];
                    const eloDiff = Math.abs(player1.eloRating! - player2.eloRating!);

                    if (eloDiff <= maxDiff) {
                        return [player1, player2];
                    }
                }
            }
        }

        return bestMatch;
    }

    /**
     * گروه‌بندی بر اساس ترجیحات
     */
    private groupByPreferences(players: MatchmakingQueue[]): MatchmakingQueue[][] {
        const groups = new Map<string, MatchmakingQueue[]>();

        for (const player of players) {
            const key = this.getPreferenceKey(player);
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(player);
        }

        return Array.from(groups.values());
    }

    /**
     * کلید ترجیحات
     */
    private getPreferenceKey(player: MatchmakingQueue): string {
        return `${player.categoryId || 'all'}_${player.difficulty || 'MIXED'}_${player.questionsCount || 10}`;
    }

    /**
     * ایجاد بازی دو نفره
     */
    private async createMatch(player1: MatchmakingQueue, player2: MatchmakingQueue): Promise<void> {
        // 1. حذف از صف
        this.queue.delete(player1.userId);
        this.queue.delete(player2.userId);

        // 2. ایجاد سشن بازی
        const match = await this.gameSessionService.createMultiplayer({
            player1Id: player1.userId,
            player2Id: player2.userId,
            categoryId: player1.categoryId || player2.categoryId,
            difficulty: player1.difficulty || player2.difficulty || 'MIXED',
            questionsCount: player1.questionsCount || 10
        });

        // 3. اطلاع‌رسانی به بازیکنان
        await this.notifyPlayers(match.id, player1.userId, player2.userId);
    }

    /**
     * اطلاع‌رسانی به بازیکنان
     */
    private async notifyPlayers(matchId: number, player1Id: number, player2Id: number): Promise<void> {
        const match = await this.gameSessionService.getById(matchId);

        // ارسال به WebSocket
        this.websocketService.sendToUser(player1Id, 'match:found', {
            matchId: match.id,
            opponent: await this.userService.getById(player2Id),
            match
        });

        this.websocketService.sendToUser(player2Id, 'match:found', {
            matchId: match.id,
            opponent: await this.userService.getById(player1Id),
            match
        });
    }
}
```

### 2.2. Redis Queue برای Matchmaking

```typescript
// backend/src/modules/matchmaking/services/redisMatchmakingQueue.ts

export class RedisMatchmakingQueue {
    private redis: RedisClient;
    private readonly QUEUE_KEY = 'matchmaking:queue';
    private readonly USER_KEY_PREFIX = 'matchmaking:user:';

    /**
     * اضافه کردن به صف Redis
     */
    async addToQueue(userId: number, preferences: MatchPreferences): Promise<void> {
        const key = `${this.USER_KEY_PREFIX}${userId}`;
        const data = {
            userId,
            preferences,
            joinedAt: Date.now()
        };

        // ذخیره در Hash
        await this.redis.hset(this.QUEUE_KEY, userId.toString(), JSON.stringify(data));

        // اضافه به Sorted Set برای مرتب‌سازی بر اساس ELO
        await this.redis.zadd(
            'matchmaking:sorted',
            preferences.eloRating || 1000,
            userId.toString()
        );

        // Set TTL: 5 دقیقه
        await this.redis.expire(key, 300);
    }

    /**
     * دریافت بازیکنان مناسب
     */
    async findMatches(userId: number, preferences: MatchPreferences): Promise<number[]> {
        const userElo = preferences.eloRating || 1000;
        const eloRange = 200; // ±200 ELO

        // جستجو در Sorted Set
        const candidates = await this.redis.zrangebyscore(
            'matchmaking:sorted',
            userElo - eloRange,
            userElo + eloRange
        );

        // فیلتر بر اساس ترجیحات
        const matches: number[] = [];

        for (const candidateId of candidates) {
            if (candidateId === userId.toString()) {
                continue;
            }

            const candidateData = await this.redis.hget(this.QUEUE_KEY, candidateId);
            if (!candidateData) {
                continue;
            }

            const candidate = JSON.parse(candidateData);
            if (this.matchPreferences(preferences, candidate.preferences)) {
                matches.push(parseInt(candidateId));
            }
        }

        return matches;
    }

    /**
     * تطبیق ترجیحات
     */
    private matchPreferences(p1: MatchPreferences, p2: MatchPreferences): boolean {
        // تطبیق Category
        if (p1.categoryId && p2.categoryId && p1.categoryId !== p2.categoryId) {
            return false;
        }

        // تطبیق Difficulty
        if (p1.difficulty && p2.difficulty && p1.difficulty !== p2.difficulty) {
            return false;
        }

        // تطبیق Questions Count
        if (p1.questionsCount && p2.questionsCount && p1.questionsCount !== p2.questionsCount) {
            return false;
        }

        return true;
    }

    /**
     * حذف از صف
     */
    async removeFromQueue(userId: number): Promise<void> {
        await this.redis.hdel(this.QUEUE_KEY, userId.toString());
        await this.redis.zrem('matchmaking:sorted', userId.toString());
        await this.redis.del(`${this.USER_KEY_PREFIX}${userId}`);
    }
}
```

---

## 3. نوبت‌بندی بازیکنان

### 3.1. Turn-Based System

```typescript
// backend/src/modules/game/services/turnBasedGameService.ts

export enum TurnState {
    WAITING_PLAYER1 = 'WAITING_PLAYER1',
    WAITING_PLAYER2 = 'WAITING_PLAYER2',
    BOTH_ANSWERED = 'BOTH_ANSWERED',
    QUESTION_COMPLETE = 'QUESTION_COMPLETE'
}

export class TurnBasedGameService {
    /**
     * دریافت سوال فعلی برای بازیکن
     */
    async getCurrentQuestion(matchId: number, userId: number): Promise<CurrentQuestion | null> {
        const match = await this.matchRepository.findById(matchId);
        if (!match) {
            throw new Error('Match not found');
        }

        // بررسی نوبت
        const turnState = await this.getTurnState(matchId);
        const isPlayerTurn = this.isPlayerTurn(match, userId, turnState);

        if (!isPlayerTurn) {
            // بازیکن باید منتظر بماند
            return {
                waiting: true,
                message: 'Waiting for opponent...',
                opponentAnswered: turnState === TurnState.BOTH_ANSWERED
            };
        }

        // دریافت سوال فعلی
        const currentQuestion = await this.getQuestionForMatch(matchId);

        return {
            questionId: currentQuestion.id,
            questionText: currentQuestion.question_text,
            options: this.shuffleOptions(currentQuestion.options),
            questionNumber: await this.getCurrentQuestionNumber(matchId),
            totalQuestions: match.questions_count,
            timeLimit: 30,
            isPlayerTurn: true
        };
    }

    /**
     * ارسال پاسخ
     */
    async submitAnswer(
        matchId: number,
        userId: number,
        answer: SubmitAnswerDto
    ): Promise<AnswerResult> {
        const match = await this.matchRepository.findById(matchId);
        if (!match) {
            throw new Error('Match not found');
        }

        // بررسی نوبت
        const turnState = await this.getTurnState(matchId);
        if (!this.canPlayerAnswer(match, userId, turnState)) {
            throw new Error('Not your turn');
        }

        // بررسی پاسخ قبلی
        const existingAnswer = await this.answerRepository.findByMatchAndQuestion(
            matchId,
            answer.questionId,
            userId
        );

        if (existingAnswer) {
            throw new Error('Already answered');
        }

        // ذخیره پاسخ
        const result = await this.saveAnswer(matchId, userId, answer);

        // به‌روزرسانی وضعیت نوبت
        await this.updateTurnState(matchId, userId);

        // اطلاع‌رسانی به بازیکن مقابل
        await this.notifyOpponent(match, userId, result);

        // بررسی تکمیل سوال
        const newTurnState = await this.getTurnState(matchId);
        if (newTurnState === TurnState.BOTH_ANSWERED) {
            await this.completeQuestion(matchId);
        }

        return result;
    }

    /**
     * دریافت وضعیت نوبت
     */
    private async getTurnState(matchId: number): Promise<TurnState> {
        const match = await this.matchRepository.findById(matchId);
        const questionNumber = await this.getCurrentQuestionNumber(matchId);

        // دریافت پاسخ‌های این سوال
        const answers = await this.answerRepository.getAnswersForQuestion(
            matchId,
            questionNumber
        );

        const player1Answered = answers.some(a => a.user_id === match.player1_id);
        const player2Answered = answers.some(a => a.user_id === match.player2_id);

        if (player1Answered && player2Answered) {
            return TurnState.BOTH_ANSWERED;
        } else if (player1Answered) {
            return TurnState.WAITING_PLAYER2;
        } else if (player2Answered) {
            return TurnState.WAITING_PLAYER1;
        } else {
            // هر دو می‌توانند پاسخ دهند (همزمان)
            return TurnState.WAITING_PLAYER1;
        }
    }

    /**
     * بررسی امکان پاسخ دادن
     */
    private canPlayerAnswer(
        match: Match,
        userId: number,
        turnState: TurnState
    ): boolean {
        // در حالت همزمان، هر دو می‌توانند پاسخ دهند
        if (turnState === TurnState.WAITING_PLAYER1 || turnState === TurnState.WAITING_PLAYER2) {
            return true;
        }

        // اگر هر دو پاسخ داده‌اند، نمی‌توان پاسخ داد
        if (turnState === TurnState.BOTH_ANSWERED) {
            return false;
        }

        return true;
    }

    /**
     * تکمیل سوال
     */
    private async completeQuestion(matchId: number): Promise<void> {
        const match = await this.matchRepository.findById(matchId);
        const questionNumber = await this.getCurrentQuestionNumber(matchId);

        // دریافت پاسخ‌ها
        const answers = await this.answerRepository.getAnswersForQuestion(
            matchId,
            questionNumber
        );

        // محاسبه امتیاز
        for (const answer of answers) {
            const points = await this.scoringService.calculatePoints(
                answer.question_id,
                answer.time_taken,
                answer.is_correct
            );

            await this.matchRepository.updatePlayerScore(
                matchId,
                answer.user_id,
                points
            );
        }

        // اطلاع‌رسانی به هر دو بازیکن
        await this.notifyQuestionComplete(matchId, answers);

        // بررسی پایان بازی
        if (questionNumber >= match.questions_count) {
            await this.endMatch(matchId);
        }
    }
}
```

### 3.2. Simultaneous Answering (همزمان)

```typescript
// backend/src/modules/game/services/simultaneousGameService.ts

export class SimultaneousGameService {
    /**
     * ارسال پاسخ (همزمان)
     * هر دو بازیکن می‌توانند همزمان پاسخ دهند
     */
    async submitAnswer(
        matchId: number,
        userId: number,
        answer: SubmitAnswerDto
    ): Promise<AnswerResult> {
        const match = await this.matchRepository.findById(matchId);

        // بررسی پاسخ قبلی
        const existingAnswer = await this.answerRepository.findByMatchAndQuestion(
            matchId,
            answer.questionId,
            userId
        );

        if (existingAnswer) {
            throw new Error('Already answered');
        }

        // ذخیره پاسخ
        const result = await this.saveAnswer(matchId, userId, answer);

        // بررسی اینکه آیا هر دو پاسخ داده‌اند
        const bothAnswered = await this.checkBothAnswered(matchId, answer.questionId);

        if (bothAnswered) {
            // نمایش نتایج به هر دو بازیکن
            await this.revealResults(matchId, answer.questionId);
        } else {
            // اطلاع‌رسانی به بازیکن مقابل که پاسخ داده‌ایم
            await this.notifyOpponentAnswered(match, userId);
        }

        return result;
    }

    /**
     * بررسی پاسخ هر دو بازیکن
     */
    private async checkBothAnswered(matchId: number, questionId: number): Promise<boolean> {
        const match = await this.matchRepository.findById(matchId);
        const answers = await this.answerRepository.getAnswersForQuestion(matchId, questionId);

        const player1Answered = answers.some(a => a.user_id === match.player1_id);
        const player2Answered = answers.some(a => a.user_id === match.player2_id);

        return player1Answered && player2Answered;
    }

    /**
     * نمایش نتایج
     */
    private async revealResults(matchId: number, questionId: number): Promise<void> {
        const match = await this.matchRepository.findById(matchId);
        const answers = await this.answerRepository.getAnswersForQuestion(matchId, questionId);
        const question = await this.questionService.getById(questionId);

        const results = {
            questionId,
            correctAnswer: question.correct_option_id,
            player1Answer: answers.find(a => a.user_id === match.player1_id),
            player2Answer: answers.find(a => a.user_id === match.player2_id),
            scores: {
                player1: await this.matchRepository.getPlayerScore(matchId, match.player1_id),
                player2: await this.matchRepository.getPlayerScore(matchId, match.player2_id)
            }
        };

        // ارسال به هر دو بازیکن
        this.websocketService.sendToMatch(matchId, 'question:results', results);

        // انتظار 3 ثانیه قبل از سوال بعدی
        setTimeout(async () => {
            await this.moveToNextQuestion(matchId);
        }, 3000);
    }
}
```

---

## 4. WebSocket Implementation

### 4.1. WebSocket Server Setup

```typescript
// backend/src/websocket/websocketServer.ts

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { RedisAdapter } from 'socket.io-redis';
import { authenticateSocket } from './middleware/auth';
import { GameSocketHandler } from './handlers/gameSocketHandler';
import { MatchmakingSocketHandler } from './handlers/matchmakingSocketHandler';

export class WebSocketServer {
    private io: SocketIOServer;
    private gameHandler: GameSocketHandler;
    private matchmakingHandler: MatchmakingSocketHandler;

    constructor(httpServer: HTTPServer) {
        // ایجاد Socket.IO Server
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || '*',
                methods: ['GET', 'POST']
            },
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000
        });

        // Redis Adapter برای چند سرور
        const redisAdapter = RedisAdapter({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379')
        });
        this.io.adapter(redisAdapter);

        // Handlers
        this.gameHandler = new GameSocketHandler(this.io);
        this.matchmakingHandler = new MatchmakingSocketHandler(this.io);

        this.setupMiddleware();
        this.setupConnectionHandlers();
    }

    /**
     * تنظیم Middleware
     */
    private setupMiddleware(): void {
        // Authentication
        this.io.use(authenticateSocket);

        // Logging
        this.io.use((socket, next) => {
            console.log(`[WebSocket] Connection attempt from ${socket.handshake.address}`);
            next();
        });
    }

    /**
     * مدیریت اتصالات
     */
    private setupConnectionHandlers(): void {
        this.io.on('connection', (socket: Socket) => {
            const userId = (socket as any).userId;

            console.log(`[WebSocket] User ${userId} connected: ${socket.id}`);

            // ثبت اتصال
            this.registerConnection(userId, socket.id);

            // Handlers
            this.gameHandler.handleConnection(socket, userId);
            this.matchmakingHandler.handleConnection(socket, userId);

            // Disconnect handler
            socket.on('disconnect', async (reason) => {
                await this.handleDisconnect(userId, socket.id, reason);
            });

            // Error handler
            socket.on('error', (error) => {
                console.error(`[WebSocket] Error for user ${userId}:`, error);
            });
        });
    }

    /**
     * ثبت اتصال
     */
    private async registerConnection(userId: number, socketId: string): Promise<void> {
        // ذخیره در Redis
        await redis.set(`socket:user:${userId}`, socketId, 'EX', 3600); // 1 hour TTL

        // اضافه به Room
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
            socket.join(`user:${userId}`);
            socket.join('online-users');
        }

        // اطلاع‌رسانی آنلاین بودن
        this.io.to('online-users').emit('user:online', { userId });
    }

    /**
     * مدیریت قطع اتصال
     */
    private async handleDisconnect(userId: number, socketId: string, reason: string): Promise<void> {
        console.log(`[WebSocket] User ${userId} disconnected: ${reason}`);

        // بررسی اتصالات دیگر
        const otherSockets = await this.getUserSockets(userId);
        if (otherSockets.length === 0) {
            // کاربر کاملاً قطع شده
            await this.handleUserOffline(userId);
        }

        // حذف از Redis
        await redis.del(`socket:user:${userId}`);
    }

    /**
     * دریافت Socket های کاربر
     */
    private async getUserSockets(userId: number): Promise<string[]> {
        const socketId = await redis.get(`socket:user:${userId}`);
        return socketId ? [socketId] : [];
    }

    /**
     * مدیریت آفلاین شدن کاربر
     */
    private async handleUserOffline(userId: number): Promise<void> {
        // بررسی بازی‌های فعال
        const activeMatches = await this.gameService.getActiveMatches(userId);

        for (const match of activeMatches) {
            // مدیریت قطع اتصال در بازی
            await this.gameHandler.handlePlayerDisconnect(match.id, userId);
        }

        // حذف از صف Matchmaking
        await this.matchmakingHandler.removeFromQueue(userId);

        // اطلاع‌رسانی
        this.io.to('online-users').emit('user:offline', { userId });
    }

    /**
     * ارسال پیام به کاربر
     */
    sendToUser(userId: number, event: string, data: any): void {
        this.io.to(`user:${userId}`).emit(event, data);
    }

    /**
     * ارسال پیام به بازی
     */
    sendToMatch(matchId: number, event: string, data: any): void {
        this.io.to(`match:${matchId}`).emit(event, data);
    }
}
```

### 4.2. Game Socket Handler

```typescript
// backend/src/websocket/handlers/gameSocketHandler.ts

export class GameSocketHandler {
    constructor(private io: SocketIOServer) {}

    handleConnection(socket: Socket, userId: number): void {
        // Join match room
        socket.on('match:join', async (data: { matchId: number }) => {
            try {
                const match = await this.gameService.getMatch(data.matchId);
                
                // بررسی دسترسی
                if (match.player1_id !== userId && match.player2_id !== userId) {
                    socket.emit('error', { message: 'Access denied' });
                    return;
                }

                // Join room
                socket.join(`match:${data.matchId}`);

                // اطلاع‌رسانی به بازیکن مقابل
                socket.to(`match:${data.matchId}`).emit('opponent:joined', {
                    userId,
                    username: await this.userService.getUsername(userId)
                });

                // ارسال وضعیت فعلی بازی
                const gameState = await this.gameService.getGameState(data.matchId);
                socket.emit('match:state', gameState);
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Leave match
        socket.on('match:leave', async (data: { matchId: number }) => {
            socket.leave(`match:${data.matchId}`);
        });

        // Submit answer
        socket.on('answer:submit', async (data: SubmitAnswerDto) => {
            try {
                const result = await this.gameService.submitAnswer(
                    data.matchId,
                    userId,
                    data
                );

                // ارسال نتیجه به کاربر
                socket.emit('answer:result', result);

                // اطلاع‌رسانی به بازیکن مقابل
                socket.to(`match:${data.matchId}`).emit('opponent:answered', {
                    userId,
                    questionId: data.questionId
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Ready signal
        socket.on('match:ready', async (data: { matchId: number }) => {
            try {
                await this.gameService.setPlayerReady(data.matchId, userId);

                // بررسی آماده بودن هر دو بازیکن
                const allReady = await this.gameService.checkAllReady(data.matchId);
                if (allReady) {
                    // شروع بازی
                    await this.gameService.startMatch(data.matchId);
                    this.io.to(`match:${data.matchId}`).emit('match:started');
                } else {
                    // اطلاع‌رسانی آماده بودن
                    socket.to(`match:${data.matchId}`).emit('opponent:ready', { userId });
                }
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Ping/Pong برای نگه داشتن اتصال
        socket.on('ping', () => {
            socket.emit('pong');
        });
    }

    /**
     * مدیریت قطع اتصال بازیکن
     */
    async handlePlayerDisconnect(matchId: number, userId: number): Promise<void> {
        const match = await this.gameService.getMatch(matchId);

        if (!match || match.status !== 'IN_PROGRESS') {
            return;
        }

        // علامت‌گذاری به عنوان disconnected
        await this.gameService.markPlayerDisconnected(matchId, userId);

        // اطلاع‌رسانی به بازیکن مقابل
        this.io.to(`match:${matchId}`).emit('opponent:disconnected', {
            userId,
            reconnectionTime: 30 // 30 ثانیه برای اتصال مجدد
        });

        // شروع تایمر اتصال مجدد
        setTimeout(async () => {
            const reconnected = await this.gameService.checkPlayerReconnected(matchId, userId);
            if (!reconnected) {
                // پایان بازی به دلیل قطع اتصال
                await this.gameService.endMatchDueToDisconnect(matchId, userId);
                this.io.to(`match:${matchId}`).emit('match:ended', {
                    reason: 'opponent_disconnected',
                    winner: match.player1_id === userId ? match.player2_id : match.player1_id
                });
            }
        }, 30000); // 30 ثانیه
    }
}
```

### 4.3. Matchmaking Socket Handler

```typescript
// backend/src/websocket/handlers/matchmakingSocketHandler.ts

export class MatchmakingSocketHandler {
    constructor(private io: SocketIOServer) {}

    handleConnection(socket: Socket, userId: number): void {
        // Join matchmaking queue
        socket.on('matchmaking:join', async (data: MatchPreferences) => {
            try {
                await this.matchmakingService.joinQueue(userId, data);
                socket.emit('matchmaking:joined', { status: 'searching' });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Leave matchmaking queue
        socket.on('matchmaking:leave', async () => {
            try {
                await this.matchmakingService.leaveQueue(userId);
                socket.emit('matchmaking:left');
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Listen for match found
        socket.on('match:found', async (data: { matchId: number }) => {
            // Join match room
            socket.join(`match:${data.matchId}`);
        });
    }

    /**
     * حذف از صف
     */
    async removeFromQueue(userId: number): Promise<void> {
        try {
            await this.matchmakingService.leaveQueue(userId);
            this.io.to(`user:${userId}`).emit('matchmaking:removed');
        } catch (error) {
            console.error(`Error removing user ${userId} from queue:`, error);
        }
    }
}
```

---

## 5. مدیریت قطع اتصال

### 5.1. Connection State Management

```typescript
// backend/src/modules/game/services/connectionManager.ts

export enum ConnectionState {
    CONNECTED = 'CONNECTED',
    DISCONNECTED = 'DISCONNECTED',
    RECONNECTING = 'RECONNECTING',
    TIMEOUT = 'TIMEOUT'
}

export class ConnectionManager {
    private disconnectionTimers: Map<string, NodeJS.Timeout> = new Map();
    private readonly RECONNECTION_TIMEOUT = 30000; // 30 ثانیه

    /**
     * مدیریت قطع اتصال
     */
    async handleDisconnection(matchId: number, userId: number): Promise<void> {
        const key = `${matchId}:${userId}`;

        // علامت‌گذاری به عنوان disconnected
        await this.gameService.updatePlayerConnectionState(
            matchId,
            userId,
            ConnectionState.DISCONNECTED
        );

        // اطلاع‌رسانی به بازیکن مقابل
        await this.notifyOpponentDisconnected(matchId, userId);

        // شروع تایمر
        const timer = setTimeout(async () => {
            await this.handleReconnectionTimeout(matchId, userId);
        }, this.RECONNECTION_TIMEOUT);

        this.disconnectionTimers.set(key, timer);
    }

    /**
     * مدیریت اتصال مجدد
     */
    async handleReconnection(matchId: number, userId: number): Promise<void> {
        const key = `${matchId}:${userId}`;

        // لغو تایمر
        const timer = this.disconnectionTimers.get(key);
        if (timer) {
            clearTimeout(timer);
            this.disconnectionTimers.delete(key);
        }

        // به‌روزرسانی وضعیت
        await this.gameService.updatePlayerConnectionState(
            matchId,
            userId,
            ConnectionState.CONNECTED
        );

        // اطلاع‌رسانی به بازیکن مقابل
        await this.notifyOpponentReconnected(matchId, userId);

        // ارسال وضعیت فعلی بازی
        const gameState = await this.gameService.getGameState(matchId);
        this.websocketService.sendToUser(userId, 'match:state', gameState);
    }

    /**
     * مدیریت Timeout اتصال مجدد
     */
    private async handleReconnectionTimeout(matchId: number, userId: number): Promise<void> {
        const match = await this.gameService.getMatch(matchId);

        if (!match || match.status !== 'IN_PROGRESS') {
            return;
        }

        // پایان بازی به دلیل قطع اتصال
        await this.gameService.endMatchDueToDisconnect(matchId, userId);

        // تعیین برنده
        const winnerId = match.player1_id === userId ? match.player2_id : match.player1_id;

        // اطلاع‌رسانی
        this.websocketService.sendToMatch(matchId, 'match:ended', {
            reason: 'opponent_disconnected',
            winner: winnerId,
            disconnectedPlayer: userId
        });
    }

    /**
     * اطلاع‌رسانی قطع اتصال
     */
    private async notifyOpponentDisconnected(matchId: number, userId: number): Promise<void> {
        const match = await this.gameService.getMatch(matchId);
        const opponentId = match.player1_id === userId ? match.player2_id : match.player1_id;

        this.websocketService.sendToUser(opponentId, 'opponent:disconnected', {
            matchId,
            reconnectionTime: this.RECONNECTION_TIMEOUT / 1000
        });
    }

    /**
     * اطلاع‌رسانی اتصال مجدد
     */
    private async notifyOpponentReconnected(matchId: number, userId: number): Promise<void> {
        const match = await this.gameService.getMatch(matchId);
        const opponentId = match.player1_id === userId ? match.player2_id : match.player1_id;

        this.websocketService.sendToUser(opponentId, 'opponent:reconnected', {
            matchId
        });
    }

    /**
     * بررسی وضعیت اتصال
     */
    async checkConnectionStatus(matchId: number, userId: number): Promise<ConnectionState> {
        return await this.gameService.getPlayerConnectionState(matchId, userId);
    }
}
```

### 5.2. Reconnection Logic

```typescript
// backend/src/modules/game/services/reconnectionService.ts

export class ReconnectionService {
    /**
     * بازیابی وضعیت بازی پس از اتصال مجدد
     */
    async restoreGameState(matchId: number, userId: number): Promise<GameState> {
        const match = await this.gameService.getMatch(matchId);

        if (!match) {
            throw new Error('Match not found');
        }

        // بررسی دسترسی
        if (match.player1_id !== userId && match.player2_id !== userId) {
            throw new Error('Access denied');
        }

        // دریافت وضعیت کامل بازی
        const gameState = await this.gameService.getGameState(matchId);

        return {
            match: {
                id: match.id,
                status: match.status,
                currentQuestion: gameState.currentQuestion,
                scores: {
                    player1: await this.getPlayerScore(match.id, match.player1_id),
                    player2: await this.getPlayerScore(match.id, match.player2_id)
                },
                answeredQuestions: await this.getAnsweredQuestions(match.id),
                timeRemaining: gameState.timeRemaining
            },
            player: {
                id: userId,
                isPlayer1: match.player1_id === userId,
                connectionState: await this.connectionManager.checkConnectionStatus(matchId, userId)
            },
            opponent: {
                id: match.player1_id === userId ? match.player2_id : match.player1_id,
                connectionState: await this.connectionManager.checkConnectionStatus(
                    matchId,
                    match.player1_id === userId ? match.player2_id : match.player1_id
                )
            }
        };
    }

    /**
     * ادامه بازی پس از اتصال مجدد
     */
    async resumeGame(matchId: number, userId: number): Promise<void> {
        // بازیابی وضعیت
        const gameState = await this.restoreGameState(matchId, userId);

        // ارسال به کاربر
        this.websocketService.sendToUser(userId, 'match:restored', gameState);

        // اگر بازی در حال اجرا است، ادامه دهید
        if (gameState.match.status === 'IN_PROGRESS') {
            // ارسال سوال فعلی
            if (gameState.match.currentQuestion) {
                const question = await this.gameService.getCurrentQuestion(matchId, userId);
                this.websocketService.sendToUser(userId, 'question:current', question);
            }
        }
    }
}
```

### 5.3. Heartbeat Mechanism

```typescript
// backend/src/websocket/middleware/heartbeat.ts

export function setupHeartbeat(socket: Socket): void {
    let lastPing: number = Date.now();
    let missedPings: number = 0;
    const MAX_MISSED_PINGS = 3;

    // Ping interval
    const pingInterval = setInterval(() => {
        const now = Date.now();
        const timeSinceLastPing = now - lastPing;

        // اگر بیش از 60 ثانیه از آخرین ping گذشته باشد
        if (timeSinceLastPing > 60000) {
            missedPings++;

            if (missedPings >= MAX_MISSED_PINGS) {
                // قطع اتصال
                clearInterval(pingInterval);
                socket.disconnect(true);
                return;
            }
        }

        // ارسال ping
        socket.emit('ping', { timestamp: now });
    }, 25000); // هر 25 ثانیه

    // دریافت pong
    socket.on('pong', () => {
        lastPing = Date.now();
        missedPings = 0;
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
        clearInterval(pingInterval);
    });
}
```

---

## 6. State Management

### 6.1. Game State Machine

```typescript
// backend/src/modules/game/state/gameStateMachine.ts

export enum GameState {
    WAITING_PLAYERS = 'WAITING_PLAYERS',
    READY = 'READY',
    IN_PROGRESS = 'IN_PROGRESS',
    QUESTION_ANSWERED = 'QUESTION_ANSWERED',
    QUESTION_COMPLETE = 'QUESTION_COMPLETE',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    DISCONNECTED = 'DISCONNECTED'
}

export class GameStateMachine {
    private currentState: GameState;
    private matchId: number;

    constructor(matchId: number, initialState: GameState = GameState.WAITING_PLAYERS) {
        this.matchId = matchId;
        this.currentState = initialState;
    }

    /**
     * انتقال به حالت بعدی
     */
    async transition(newState: GameState, data?: any): Promise<void> {
        // بررسی امکان انتقال
        if (!this.canTransition(this.currentState, newState)) {
            throw new Error(`Invalid transition from ${this.currentState} to ${newState}`);
        }

        const oldState = this.currentState;
        this.currentState = newState;

        // ذخیره در دیتابیس
        await this.saveState(newState, data);

        // اجرای اقدامات مربوط به حالت جدید
        await this.onStateChange(oldState, newState, data);

        // اطلاع‌رسانی
        await this.notifyStateChange(newState, data);
    }

    /**
     * بررسی امکان انتقال
     */
    private canTransition(from: GameState, to: GameState): boolean {
        const validTransitions: Record<GameState, GameState[]> = {
            [GameState.WAITING_PLAYERS]: [GameState.READY, GameState.CANCELLED],
            [GameState.READY]: [GameState.IN_PROGRESS, GameState.CANCELLED],
            [GameState.IN_PROGRESS]: [
                GameState.QUESTION_ANSWERED,
                GameState.QUESTION_COMPLETE,
                GameState.DISCONNECTED
            ],
            [GameState.QUESTION_ANSWERED]: [
                GameState.QUESTION_COMPLETE,
                GameState.IN_PROGRESS
            ],
            [GameState.QUESTION_COMPLETE]: [
                GameState.IN_PROGRESS,
                GameState.COMPLETED
            ],
            [GameState.COMPLETED]: [],
            [GameState.CANCELLED]: [],
            [GameState.DISCONNECTED]: [GameState.IN_PROGRESS, GameState.CANCELLED]
        };

        return validTransitions[from]?.includes(to) || false;
    }

    /**
     * اقدامات هنگام تغییر حالت
     */
    private async onStateChange(
        oldState: GameState,
        newState: GameState,
        data?: any
    ): Promise<void> {
        switch (newState) {
            case GameState.IN_PROGRESS:
                await this.startGame();
                break;
            case GameState.QUESTION_COMPLETE:
                await this.moveToNextQuestion();
                break;
            case GameState.COMPLETED:
                await this.endGame();
                break;
            case GameState.DISCONNECTED:
                await this.handleDisconnection();
                break;
        }
    }
}
```

### 6.2. Redis State Storage

```typescript
// backend/src/modules/game/storage/redisGameState.ts

export class RedisGameState {
    private redis: RedisClient;
    private readonly STATE_KEY_PREFIX = 'game:state:';
    private readonly TTL = 3600; // 1 hour

    /**
     * ذخیره وضعیت بازی
     */
    async saveState(matchId: number, state: GameState): Promise<void> {
        const key = `${this.STATE_KEY_PREFIX}${matchId}`;
        await this.redis.setex(key, this.TTL, JSON.stringify(state));
    }

    /**
     * دریافت وضعیت بازی
     */
    async getState(matchId: number): Promise<GameState | null> {
        const key = `${this.STATE_KEY_PREFIX}${matchId}`;
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    /**
     * ذخیره وضعیت بازیکن
     */
    async savePlayerState(
        matchId: number,
        userId: number,
        state: PlayerState
    ): Promise<void> {
        const key = `game:player:${matchId}:${userId}`;
        await this.redis.setex(key, this.TTL, JSON.stringify(state));
    }

    /**
     * دریافت وضعیت بازیکن
     */
    async getPlayerState(matchId: number, userId: number): Promise<PlayerState | null> {
        const key = `game:player:${matchId}:${userId}`;
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }
}
```

---

## 7. Error Handling & Recovery

### 7.1. Error Recovery Strategies

```typescript
// backend/src/modules/game/services/errorRecovery.ts

export class ErrorRecoveryService {
    /**
     * بازیابی از خطا
     */
    async recoverFromError(matchId: number, error: Error): Promise<void> {
        console.error(`[Error Recovery] Match ${matchId}:`, error);

        // تشخیص نوع خطا
        const errorType = this.classifyError(error);

        switch (errorType) {
            case 'CONNECTION_ERROR':
                await this.recoverConnectionError(matchId);
                break;
            case 'STATE_INCONSISTENCY':
                await this.recoverStateInconsistency(matchId);
                break;
            case 'DATA_CORRUPTION':
                await this.recoverDataCorruption(matchId);
                break;
            default:
                await this.recoverGenericError(matchId, error);
        }
    }

    /**
     * بازیابی خطای اتصال
     */
    private async recoverConnectionError(matchId: number): Promise<void> {
        const match = await this.gameService.getMatch(matchId);

        // بررسی اتصال هر دو بازیکن
        const player1Connected = await this.checkPlayerConnection(match.player1_id);
        const player2Connected = await this.checkPlayerConnection(match.player2_id);

        if (!player1Connected && !player2Connected) {
            // هر دو قطع شده‌اند - ذخیره وضعیت و انتظار
            await this.saveGameStateForRecovery(matchId);
        } else if (!player1Connected || !player2Connected) {
            // یکی قطع شده - شروع تایمر اتصال مجدد
            await this.connectionManager.handleDisconnection(
                matchId,
                player1Connected ? match.player2_id : match.player1_id
            );
        }
    }

    /**
     * بازیابی ناسازگاری وضعیت
     */
    private async recoverStateInconsistency(matchId: number): Promise<void> {
        // دریافت وضعیت از دیتابیس
        const dbState = await this.gameService.getGameStateFromDB(matchId);
        
        // دریافت وضعیت از Redis
        const redisState = await this.redisGameState.getState(matchId);

        // مقایسه و انتخاب منبع معتبرتر
        if (dbState && redisState) {
            // دیتابیس منبع معتبرتر است
            await this.redisGameState.saveState(matchId, dbState);
        } else if (dbState) {
            // فقط دیتابیس موجود است
            await this.redisGameState.saveState(matchId, dbState);
        } else if (redisState) {
            // فقط Redis موجود است - ذخیره در دیتابیس
            await this.gameService.saveGameStateToDB(matchId, redisState);
        } else {
            // هیچ کدام موجود نیست - بازیابی از لاگ
            await this.recoverFromLogs(matchId);
        }
    }

    /**
     * طبقه‌بندی خطا
     */
    private classifyError(error: Error): string {
        if (error.message.includes('connection') || error.message.includes('socket')) {
            return 'CONNECTION_ERROR';
        }
        if (error.message.includes('state') || error.message.includes('invalid transition')) {
            return 'STATE_INCONSISTENCY';
        }
        if (error.message.includes('data') || error.message.includes('corrupt')) {
            return 'DATA_CORRUPTION';
        }
        return 'GENERIC_ERROR';
    }
}
```

### 7.2. Transaction Management

```typescript
// backend/src/modules/game/services/transactionManager.ts

export class TransactionManager {
    /**
     * اجرای تراکنش امن
     */
    async executeTransaction<T>(
        matchId: number,
        operation: () => Promise<T>
    ): Promise<T> {
        const client = await db.getClient();

        try {
            await client.query('BEGIN');

            // Lock match
            await this.lockMatch(matchId, client);

            // اجرای عملیات
            const result = await operation();

            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Lock کردن بازی
     */
    private async lockMatch(matchId: number, client: any): Promise<void> {
        await client.query(
            'SELECT * FROM matches WHERE id = $1 FOR UPDATE',
            [matchId]
        );
    }
}
```

---

## 8. Scalability & Performance

### 8.1. Load Balancing

```typescript
// backend/src/websocket/loadBalancer.ts

export class WebSocketLoadBalancer {
    /**
     * انتخاب سرور مناسب
     */
    async selectServer(userId: number): Promise<string> {
        // استراتژی: Round Robin با در نظر گیری Load
        const servers = await this.getAvailableServers();
        const serverLoads = await Promise.all(
            servers.map(server => this.getServerLoad(server))
        );

        // انتخاب سرور با کمترین Load
        const minLoad = Math.min(...serverLoads);
        const selectedServer = servers[serverLoads.indexOf(minLoad)];

        return selectedServer;
    }

    /**
     * دریافت Load سرور
     */
    private async getServerLoad(serverId: string): Promise<number> {
        const activeConnections = await redis.get(`server:${serverId}:connections`);
        const activeMatches = await redis.get(`server:${serverId}:matches`);
        
        return (parseInt(activeConnections || '0') * 0.5) + 
               (parseInt(activeMatches || '0') * 1.0);
    }
}
```

### 8.2. Caching Strategy

```typescript
// backend/src/modules/game/cache/gameCache.ts

export class GameCache {
    /**
     * Cache کردن وضعیت بازی
     */
    async cacheGameState(matchId: number, state: GameState): Promise<void> {
        const key = `game:state:${matchId}`;
        await redis.setex(key, 300, JSON.stringify(state)); // 5 minutes
    }

    /**
     * دریافت از Cache
     */
    async getCachedGameState(matchId: number): Promise<GameState | null> {
        const key = `game:state:${matchId}`;
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Invalidate Cache
     */
    async invalidateGameState(matchId: number): Promise<void> {
        const key = `game:state:${matchId}`;
        await redis.del(key);
    }
}
```

### 8.3. Database Optimization

```sql
-- Indexes برای بازی‌های آنلاین
CREATE INDEX idx_matches_status_active ON matches(status) 
WHERE status IN ('WAITING_PLAYERS', 'IN_PROGRESS');

CREATE INDEX idx_matches_players ON matches(player1_id, player2_id) 
WHERE status = 'IN_PROGRESS';

CREATE INDEX idx_user_answers_match_question ON user_answers(match_id, question_id);

-- Partial Index برای بازی‌های فعال
CREATE INDEX idx_matches_active ON matches(id, status, started_at) 
WHERE status = 'IN_PROGRESS';
```

---

## 9. API Endpoints

### 9.1. Matchmaking APIs

```typescript
// POST /api/matchmaking/join
// Body: { categoryId?, difficulty?, questionsCount? }
// Response: { status: 'searching', estimatedTime?: number }

// POST /api/matchmaking/leave
// Response: { status: 'left' }

// GET /api/matchmaking/status
// Response: { inQueue: boolean, position?: number }
```

### 9.2. Game APIs

```typescript
// POST /api/game/create
// Body: { gameMode: 'SINGLE_PLAYER' | 'MULTI_PLAYER', ... }
// Response: { matchId, status }

// POST /api/game/:matchId/join
// Response: { match, gameState }

// POST /api/game/:matchId/answer
// Body: { questionId, selectedOptionId, timeTaken }
// Response: { isCorrect, pointsEarned, explanation }

// GET /api/game/:matchId/state
// Response: { match, currentQuestion, scores, ... }
```

---

## 10. Frontend Integration

### 10.1. WebSocket Client

```typescript
// frontend/src/services/websocketClient.ts

export class WebSocketClient {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private readonly MAX_RECONNECT_ATTEMPTS = 5;

    connect(token: string): void {
        this.socket = io(process.env.WS_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Connected to WebSocket');
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected:', reason);
            this.handleReconnection();
        });

        this.socket.on('match:found', (data) => {
            // Handle match found
        });

        this.socket.on('opponent:disconnected', (data) => {
            // Show reconnection timer
        });

        this.socket.on('match:state', (state) => {
            // Update game state
        });
    }

    private handleReconnection(): void {
        if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
            this.reconnectAttempts++;
            setTimeout(() => {
                this.connect(this.getToken());
            }, 1000 * this.reconnectAttempts);
        }
    }
}
```

---

## خلاصه

این سیستم شامل:

1. **Matchmaking**: الگوریتم تطبیق بازیکنان با ELO Rating
2. **Turn-Based**: سیستم نوبت‌بندی و پاسخ همزمان
3. **WebSocket**: ارتباط Real-time با Redis Pub/Sub
4. **Connection Management**: مدیریت قطع اتصال و اتصال مجدد
5. **State Management**: State Machine و Redis Cache
6. **Error Recovery**: استراتژی‌های بازیابی از خطا
7. **Scalability**: Load Balancing و Caching

سیستم برای Production-ready طراحی شده و قابلیت مقیاس‌پذیری دارد.

