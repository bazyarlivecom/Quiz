# منطق کامل بازی Quiz - مرحله به مرحله

این سند منطق کامل بازی را به صورت مرحله به مرحله و قابل تبدیل مستقیم به کد توضیح می‌دهد.

---

## 📋 فهرست مراحل

1. [شروع بازی](#1-شروع-بازی)
2. [انتخاب دسته و تنظیمات](#2-انتخاب-دسته-و-تنظیمات)
3. [انتخاب تصادفی سوالات](#3-انتخاب-تصادفی-سوالات)
4. [نمایش سوال و شروع تایمر](#4-نمایش-سوال-و-شروع-تایمر)
5. [دریافت پاسخ کاربر](#5-دریافت-پاسخ-کاربر)
6. [بررسی پاسخ و محاسبه امتیاز](#6-بررسی-پاسخ-و-محاسبه-امتیاز)
7. [به‌روزرسانی وضعیت بازی](#7-به‌روزرسانی-وضعیت-بازی)
8. [پایان راند](#8-پایان-راند)
9. [تعیین برنده و پایان بازی](#9-تعیین-برنده-و-پایان-بازی)

---

## 1. شروع بازی

### 1.1. درخواست شروع بازی

**Input:**
```typescript
interface StartGameRequest {
    userId: number;
    gameMode: 'SINGLE_PLAYER' | 'MULTI_PLAYER' | 'PRACTICE';
    categoryId?: number;  // Optional - null = all categories
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | 'MIXED';
    questionsCount?: number;  // Default: 10
    opponentUserId?: number;  // Required for MULTI_PLAYER
}
```

**Logic:**
```typescript
function startGame(request: StartGameRequest): GameSession {
    // 1. Validate user exists and is active
    const user = getUserById(request.userId);
    if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
    }
    
    // 2. Validate game mode
    if (request.gameMode === 'MULTI_PLAYER') {
        if (!request.opponentUserId) {
            throw new Error('Opponent user ID required for multiplayer');
        }
        
        const opponent = getUserById(request.opponentUserId);
        if (!opponent || !opponent.is_active) {
            throw new Error('Opponent not found or inactive');
        }
        
        // Check if opponent is available (not in another active game)
        if (hasActiveGame(request.opponentUserId)) {
            throw new Error('Opponent is already in a game');
        }
    }
    
    // For PRACTICE mode: allow multiple active sessions, no opponent needed
    // 3. Validate category if provided
    if (request.categoryId) {
        const category = getCategoryById(request.categoryId);
        if (!category || !category.is_active) {
            throw new Error('Category not found or inactive');
        }
    }
    
    // 4. Check if user has active game (skip for PRACTICE mode)
    if (request.gameMode !== 'PRACTICE' && hasActiveGame(request.userId)) {
        throw new Error('User already has an active game');
    }
    
    // 5. Set defaults
    const questionsCount = request.questionsCount || 10;
    const difficulty = request.difficulty || 'MIXED';
    
    // 6. Create game session(s)
    const session = createGameSession({
        userId: request.userId,
        gameMode: request.gameMode,
        categoryId: request.categoryId,
        difficulty: difficulty,
        questionsCount: questionsCount,
        status: 'ACTIVE',
        startedAt: new Date(),
        isPractice: request.gameMode === 'PRACTICE'  // Mark as practice mode
    });
    
    // 7. For multiplayer, create session for opponent
    if (request.gameMode === 'MULTI_PLAYER') {
        const opponentSession = createGameSession({
            userId: request.opponentUserId,
            gameMode: 'MULTI_PLAYER',
            categoryId: request.categoryId,
            difficulty: difficulty,
            questionsCount: questionsCount,
            status: 'ACTIVE',
            startedAt: new Date(),
            parentSessionId: session.id  // Link sessions
        });
        
        // Link sessions together
        linkGameSessions(session.id, opponentSession.id);
    }
    
    return session;
}
```

**Database Operations:**
```sql
-- Insert into matches table
INSERT INTO matches (
    user_id, 
    category_id, 
    difficulty, 
    questions_count, 
    status, 
    started_at
) VALUES (
    :userId,
    :categoryId,
    :difficulty,
    :questionsCount,
    'ACTIVE',
    CURRENT_TIMESTAMP
) RETURNING id;
```

---

## 2. انتخاب دسته و تنظیمات

### 2.1. دریافت دسته‌بندی‌های فعال

**Logic:**
```typescript
function getActiveCategories(): Category[] {
    return db.query(`
        SELECT id, name, description, icon, color
        FROM categories
        WHERE is_active = true
        ORDER BY sort_order ASC, name ASC
    `);
}
```

### 2.2. دریافت سوالات بر اساس فیلتر

**Logic:**
```typescript
function getAvailableQuestions(
    categoryId: number | null,
    difficulty: string,
    count: number
): Question[] {
    let query = `
        SELECT q.id, q.question_text, q.difficulty, q.points, q.explanation
        FROM questions q
        WHERE q.is_active = true
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (categoryId !== null) {
        query += ` AND q.category_id = $${paramIndex}`;
        params.push(categoryId);
        paramIndex++;
    }
    
    if (difficulty !== 'MIXED') {
        query += ` AND q.difficulty = $${paramIndex}`;
        params.push(difficulty);
        paramIndex++;
    }
    
    query += ` ORDER BY RANDOM() LIMIT $${paramIndex}`;
    params.push(count);
    
    return db.query(query, params);
}
```

---

## 3. انتخاب تصادفی سوالات

### 3.1. انتخاب سوالات برای بازی

**Logic:**
```typescript
function selectQuestionsForGame(
    sessionId: number,
    categoryId: number | null,
    difficulty: string,
    count: number
): Question[] {
    // 1. Get available questions
    const availableQuestions = getAvailableQuestions(
        categoryId,
        difficulty,
        count * 2  // Get more to ensure we have enough
    );
    
    if (availableQuestions.length < count) {
        throw new Error(`Not enough questions available. Found: ${availableQuestions.length}, Required: ${count}`);
    }
    
    // 2. Randomly select questions
    const selectedQuestions = shuffleArray(availableQuestions).slice(0, count);
    
    // 3. Save selected questions to match_questions table
    selectedQuestions.forEach((question, index) => {
        db.query(`
            INSERT INTO match_questions (match_id, question_id, question_order)
            VALUES ($1, $2, $3)
        `, [sessionId, question.id, index + 1]);
    });
    
    // 4. Load options for each question
    const questionsWithOptions = selectedQuestions.map(question => ({
        ...question,
        options: getQuestionOptions(question.id)
    }));
    
    return questionsWithOptions;
}

function getQuestionOptions(questionId: number): QuestionOption[] {
    return db.query(`
        SELECT id, option_text, option_order
        FROM question_options
        WHERE question_id = $1
        ORDER BY option_order ASC
    `, [questionId]);
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
```

**Database Operations:**
```sql
-- Insert selected questions
INSERT INTO match_questions (match_id, question_id, question_order)
VALUES 
    (:sessionId, :questionId1, 1),
    (:sessionId, :questionId2, 2),
    ...
    (:sessionId, :questionId10, 10);
```

---

## 4. نمایش سوال و شروع تایمر

### 4.1. دریافت سوال فعلی

**Logic:**
```typescript
function getCurrentQuestion(sessionId: number): CurrentQuestion | null {
    const session = getGameSession(sessionId);
    if (!session || session.status !== 'ACTIVE') {
        return null;
    }
    
    // Get current question index (from answered questions count)
    const answeredCount = getAnsweredQuestionsCount(sessionId);
    
    if (answeredCount >= session.questions_count) {
        return null;  // All questions answered
    }
    
    // Get question at current index
    const matchQuestion = db.query(`
        SELECT mq.question_id, mq.question_order
        FROM match_questions mq
        WHERE mq.match_id = $1
        ORDER BY mq.question_order ASC
        LIMIT 1 OFFSET $2
    `, [sessionId, answeredCount]);
    
    if (!matchQuestion) {
        return null;
    }
    
    const question = getQuestionById(matchQuestion.question_id);
    const options = getQuestionOptions(question.id);
    
    // Shuffle options (except in backend, we know correct answer)
    const shuffledOptions = shuffleArray(options);
    
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
        timeLimit: 30  // seconds
    };
}
```

### 4.2. شروع تایمر

**Frontend Logic:**
```typescript
class QuizTimer {
    private timeRemaining: number;
    private timerInterval: NodeJS.Timeout | null = null;
    private onTimeUp: () => void;
    private onTick: (time: number) => void;
    
    constructor(
        timeLimit: number,
        onTimeUp: () => void,
        onTick: (time: number) => void
    ) {
        this.timeRemaining = timeLimit;
        this.onTimeUp = onTimeUp;
        this.onTick = onTick;
    }
    
    start(): void {
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.onTick(this.timeRemaining);
            
            if (this.timeRemaining <= 0) {
                this.stop();
                this.onTimeUp();
            }
        }, 1000);
    }
    
    stop(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    getTimeRemaining(): number {
        return this.timeRemaining;
    }
}
```

**Backend Validation:**
```typescript
function validateAnswerTime(
    sessionId: number,
    questionId: number,
    submittedTime: Date
): boolean {
    // Get when question was shown (from match_questions created_at or track separately)
    const questionStartTime = getQuestionStartTime(sessionId, questionId);
    
    if (!questionStartTime) {
        return false;  // Question not found in session
    }
    
    const timeTaken = Math.floor((submittedTime.getTime() - questionStartTime.getTime()) / 1000);
    
    // Validate time is reasonable (not too fast, not expired)
    if (timeTaken < 0) {
        return false;  // Time travel not allowed
    }
    
    if (timeTaken > 35) {  // 30s limit + 5s buffer
        return false;  // Time expired
    }
    
    return true;
}
```

---

## 5. دریافت پاسخ کاربر

### 5.1. Submit Answer

**Input:**
```typescript
interface SubmitAnswerRequest {
    sessionId: number;
    questionId: number;
    selectedOptionId: number;
    timeTaken: number;  // seconds
    submittedAt: Date;
}
```

**Logic:**
```typescript
function submitAnswer(request: SubmitAnswerRequest): AnswerResult {
    // 1. Validate session
    const session = getGameSession(request.sessionId);
    if (!session || session.status !== 'ACTIVE') {
        throw new Error('Game session not found or not active');
    }
    
    // 2. Validate question belongs to session
    const matchQuestion = db.query(`
        SELECT mq.*
        FROM match_questions mq
        WHERE mq.match_id = $1 AND mq.question_id = $2
    `, [request.sessionId, request.questionId]);
    
    if (!matchQuestion) {
        throw new Error('Question not found in this game session');
    }
    
    // 3. Check if already answered
    const existingAnswer = db.query(`
        SELECT id FROM user_answers
        WHERE match_id = $1 AND question_id = $2
    `, [request.sessionId, request.questionId]);
    
    if (existingAnswer) {
        throw new Error('Question already answered');
    }
    
    // 4. Check if practice mode
    const isPractice = session.isPractice || false;
    
    // 5. Validate time (skip for practice mode)
    if (!isPractice && !validateAnswerTime(request.sessionId, request.questionId, request.submittedAt)) {
        throw new Error('Invalid answer time');
    }
    
    // 6. Get correct answer
    const correctOption = db.query(`
        SELECT id FROM question_options
        WHERE question_id = $1 AND is_correct = true
    `, [request.questionId]);
    
    if (!correctOption) {
        throw new Error('Correct answer not found');
    }
    
    // 7. Check if answer is correct
    const isCorrect = request.selectedOptionId === correctOption.id;
    
    // 8. Get question details
    const question = getQuestionById(request.questionId);
    
    // 9. Calculate points (0 for practice mode)
    const pointsEarned = isPractice ? 0 : (isCorrect 
        ? calculatePoints(question, request.timeTaken || 0)
        : 0);
    
    // 10. Save answer
    const answerId = db.query(`
        INSERT INTO user_answers (
            match_id,
            question_id,
            selected_option_id,
            user_answer_text,
            is_correct,
            time_taken,
            points_earned,
            answered_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
    `, [
        request.sessionId,
        request.questionId,
        request.selectedOptionId,
        getOptionText(request.selectedOptionId),
        isCorrect,
        request.timeTaken,
        pointsEarned,
        request.submittedAt
    ]);
    
    // 11. Update session statistics (no scoring update for practice mode)
    if (!isPractice) {
        updateSessionStats(request.sessionId, isCorrect, pointsEarned);
    } else {
        // In practice mode, just track correct/wrong count (no points)
        updateSessionStats(request.sessionId, isCorrect, 0);
    }
    
    return {
        answerId: answerId,
        isCorrect: isCorrect,
        correctOptionId: correctOption.id,
        pointsEarned: pointsEarned,
        explanation: question.explanation,
        isPractice: isPractice
    };
}
```

---

## 6. بررسی پاسخ و محاسبه امتیاز

### 6.1. محاسبه امتیاز

**Logic:**
```typescript
function calculatePoints(
    question: Question,
    timeTaken: number
): number {
    // Base points from question
    const basePoints = question.points;
    
    // Difficulty multiplier
    const difficultyMultiplier = getDifficultyMultiplier(question.difficulty);
    
    // Time bonus
    const timeBonus = calculateTimeBonus(timeTaken);
    
    // Final calculation
    const finalPoints = Math.round(
        basePoints * difficultyMultiplier * timeBonus
    );
    
    return finalPoints;
}

function getDifficultyMultiplier(difficulty: string): number {
    const multipliers = {
        'EASY': 1.0,
        'MEDIUM': 1.5,
        'HARD': 2.0,
        'EXPERT': 3.0
    };
    return multipliers[difficulty] || 1.0;
}

function calculateTimeBonus(timeTaken: number): number {
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
```

### 6.2. به‌روزرسانی آمار Session

**Logic:**
```typescript
function updateSessionStats(
    sessionId: number,
    isCorrect: boolean,
    pointsEarned: number
): void {
    db.query(`
        UPDATE matches
        SET 
            total_score = total_score + $1,
            correct_answers = correct_answers + $2,
            wrong_answers = wrong_answers + $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
    `, [
        pointsEarned,
        isCorrect ? 1 : 0,
        isCorrect ? 0 : 1,
        sessionId
    ]);
}
```

### 6.3. محاسبه XP

**Logic:**
```typescript
function calculateXP(
    question: Question,
    isCorrect: boolean,
    timeTaken: number
): number {
    if (!isCorrect) {
        return 0;
    }
    
    // Base XP by difficulty
    const baseXP = {
        'EASY': 10,
        'MEDIUM': 20,
        'HARD': 30,
        'EXPERT': 50
    }[question.difficulty] || 10;
    
    // Time bonus (20% if answered in less than 5 seconds)
    const timeBonus = timeTaken < 5 ? 0.2 : 0;
    
    return Math.round(baseXP * (1 + timeBonus));
}
```

### 6.4. به‌روزرسانی XP و Level کاربر

**Logic:**
```typescript
function updateUserXP(userId: number, xpGained: number): LevelUpResult {
    // Get current user
    const user = getUserById(userId);
    const oldLevel = user.level;
    const oldXP = user.xp;
    
    // Add XP
    const newXP = oldXP + xpGained;
    
    // Calculate new level
    const newLevel = calculateLevel(newXP);
    
    // Update user
    db.query(`
        UPDATE users
        SET 
            xp = $1,
            level = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
    `, [newXP, newLevel, userId]);
    
    // Check if leveled up
    const leveledUp = newLevel > oldLevel;
    
    return {
        oldLevel: oldLevel,
        newLevel: newLevel,
        oldXP: oldXP,
        newXP: newXP,
        xpGained: xpGained,
        leveledUp: leveledUp,
        xpForNextLevel: leveledUp ? getXPForLevel(newLevel + 1) : getXPForLevel(newLevel + 1)
    };
}

function calculateLevel(xp: number): number {
    // Formula: level = floor(sqrt(xp / 100)) + 1
    return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function getXPForLevel(level: number): number {
    // Formula: (level - 1)² × 100
    return Math.pow(level - 1, 2) * 100;
}
```

---

## 7. به‌روزرسانی وضعیت بازی

### 7.1. بررسی پایان سوالات

**Logic:**
```typescript
function checkGameProgress(sessionId: number): GameProgress {
    const session = getGameSession(sessionId);
    const answeredCount = getAnsweredQuestionsCount(sessionId);
    const totalQuestions = session.questions_count;
    
    return {
        sessionId: sessionId,
        currentQuestion: answeredCount + 1,
        totalQuestions: totalQuestions,
        isComplete: answeredCount >= totalQuestions,
        progress: (answeredCount / totalQuestions) * 100
    };
}

function getAnsweredQuestionsCount(sessionId: number): number {
    const result = db.query(`
        SELECT COUNT(*) as count
        FROM user_answers
        WHERE match_id = $1
    `, [sessionId]);
    
    return parseInt(result.count);
}
```

### 7.2. مدیریت Timeout

**Logic:**
```typescript
function handleQuestionTimeout(
    sessionId: number,
    questionId: number
): void {
    // Mark as wrong answer with time = 30 (time limit)
    const question = getQuestionById(questionId);
    
    db.query(`
        INSERT INTO user_answers (
            match_id,
            question_id,
            selected_option_id,
            user_answer_text,
            is_correct,
            time_taken,
            points_earned,
            answered_at
        ) VALUES ($1, $2, NULL, 'TIMEOUT', false, 30, 0, CURRENT_TIMESTAMP)
    `, [sessionId, questionId]);
    
    // Update session stats
    updateSessionStats(sessionId, false, 0);
    
    // Check if game should end
    const progress = checkGameProgress(sessionId);
    if (progress.isComplete) {
        endGame(sessionId);
    }
}
```

---

## 8. پایان راند

### 8.1. پایان بازی

**Logic:**
```typescript
function endGame(sessionId: number): GameResult {
    const session = getGameSession(sessionId);
    
    if (session.status !== 'ACTIVE') {
        throw new Error('Game is not active');
    }
    
    // 1. Calculate final statistics
    const stats = calculateFinalStats(sessionId);
    
    // 2. Update user total score
    db.query(`
        UPDATE users
        SET total_score = total_score + $1
        WHERE id = $2
    `, [stats.totalScore, session.user_id]);
    
    // 3. Update user stats per category
    updateUserCategoryStats(session.user_id, session.category_id, stats);
    
    // 4. Mark session as completed
    const timeSpent = Math.floor(
        (new Date().getTime() - session.started_at.getTime()) / 1000
    );
    
    db.query(`
        UPDATE matches
        SET 
            status = 'COMPLETED',
            ended_at = CURRENT_TIMESTAMP,
            time_spent = $1
        WHERE id = $2
    `, [timeSpent, sessionId]);
    
    // 5. Check achievements
    const newAchievements = checkAchievements(session.user_id);
    
    // 6. For multiplayer, check opponent status
    let opponentResult = null;
    if (session.game_mode === 'MULTI_PLAYER') {
        const opponentSession = getOpponentSession(sessionId);
        if (opponentSession && opponentSession.status === 'COMPLETED') {
            opponentResult = getGameResult(opponentSession.id);
        }
    }
    
    return {
        sessionId: sessionId,
        userId: session.user_id,
        totalScore: stats.totalScore,
        correctAnswers: stats.correctAnswers,
        wrongAnswers: stats.wrongAnswers,
        accuracy: stats.accuracy,
        timeSpent: timeSpent,
        newAchievements: newAchievements,
        opponentResult: opponentResult,
        isWinner: opponentResult ? stats.totalScore > opponentResult.totalScore : null
    };
}

function calculateFinalStats(sessionId: number): FinalStats {
    const result = db.query(`
        SELECT 
            SUM(points_earned) as total_score,
            COUNT(CASE WHEN is_correct THEN 1 END) as correct_answers,
            COUNT(CASE WHEN NOT is_correct THEN 1 END) as wrong_answers,
            AVG(time_taken) as average_time
        FROM user_answers
        WHERE match_id = $1
    `, [sessionId]);
    
    const totalAnswers = result.correct_answers + result.wrong_answers;
    const accuracy = totalAnswers > 0 
        ? (result.correct_answers / totalAnswers) * 100 
        : 0;
    
    return {
        totalScore: result.total_score || 0,
        correctAnswers: result.correct_answers || 0,
        wrongAnswers: result.wrong_answers || 0,
        accuracy: Math.round(accuracy * 100) / 100,
        averageTime: Math.round(result.average_time * 100) / 100
    };
}
```

### 8.2. به‌روزرسانی آمار کاربر بر اساس دسته

**Logic:**
```typescript
function updateUserCategoryStats(
    userId: number,
    categoryId: number | null,
    stats: FinalStats
): void {
    // Get or create user stats
    let userStats = db.query(`
        SELECT * FROM user_stats
        WHERE user_id = $1 AND category_id IS NOT DISTINCT FROM $2
    `, [userId, categoryId]);
    
    if (!userStats) {
        // Create new stats record
        db.query(`
            INSERT INTO user_stats (
                user_id,
                category_id,
                games_played,
                total_questions,
                correct_answers,
                wrong_answers,
                best_score,
                average_score,
                accuracy_rate
            ) VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8)
        `, [
            userId,
            categoryId,
            stats.correctAnswers + stats.wrongAnswers,
            stats.correctAnswers,
            stats.wrongAnswers,
            stats.totalScore,
            stats.totalScore,
            stats.accuracy
        ]);
    } else {
        // Update existing stats
        const newGamesPlayed = userStats.games_played + 1;
        const newTotalQuestions = userStats.total_questions + stats.correctAnswers + stats.wrongAnswers;
        const newCorrectAnswers = userStats.correct_answers + stats.correctAnswers;
        const newWrongAnswers = userStats.wrong_answers + stats.wrongAnswers;
        const newBestScore = Math.max(userStats.best_score, stats.totalScore);
        const newAverageScore = (
            (userStats.average_score * userStats.games_played) + stats.totalScore
        ) / newGamesPlayed;
        const newAccuracy = (newCorrectAnswers / newTotalQuestions) * 100;
        
        db.query(`
            UPDATE user_stats
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
            WHERE user_id = $8 AND category_id IS NOT DISTINCT FROM $9
        `, [
            newGamesPlayed,
            newTotalQuestions,
            newCorrectAnswers,
            newWrongAnswers,
            newBestScore,
            newAverageScore,
            newAccuracy,
            userId,
            categoryId
        ]);
    }
}
```

---

## 9. تعیین برنده و پایان بازی

### 9.1. مقایسه نتایج (Multiplayer)

**Logic:**
```typescript
function compareGameResults(
    session1Id: number,
    session2Id: number
): GameComparison {
    const result1 = getGameResult(session1Id);
    const result2 = getGameResult(session2Id);
    
    // Compare scores
    if (result1.totalScore > result2.totalScore) {
        return {
            winner: result1.userId,
            winnerScore: result1.totalScore,
            loser: result2.userId,
            loserScore: result2.totalScore,
            difference: result1.totalScore - result2.totalScore,
            tie: false
        };
    } else if (result2.totalScore > result1.totalScore) {
        return {
            winner: result2.userId,
            winnerScore: result2.totalScore,
            loser: result1.userId,
            loserScore: result1.totalScore,
            difference: result2.totalScore - result1.totalScore,
            tie: false
        };
    } else {
        // Tie - compare by accuracy
        if (result1.accuracy > result2.accuracy) {
            return {
                winner: result1.userId,
                winnerScore: result1.totalScore,
                loser: result2.userId,
                loserScore: result2.totalScore,
                difference: 0,
                tie: true,
                tieBreaker: 'ACCURACY'
            };
        } else if (result2.accuracy > result1.accuracy) {
            return {
                winner: result2.userId,
                winnerScore: result2.totalScore,
                loser: result1.userId,
                loserScore: result1.totalScore,
                difference: 0,
                tie: true,
                tieBreaker: 'ACCURACY'
            };
        } else {
            // Complete tie
            return {
                winner: null,
                winnerScore: result1.totalScore,
                loser: null,
                loserScore: result2.totalScore,
                difference: 0,
                tie: true,
                tieBreaker: 'COMPLETE_TIE'
            };
        }
    }
}
```

### 9.2. بررسی دستاوردها

**Logic:**
```typescript
function checkAchievements(userId: number): Achievement[] {
    const user = getUserById(userId);
    const unlockedAchievements: Achievement[] = [];
    
    // Get all active achievements
    const achievements = db.query(`
        SELECT * FROM achievements
        WHERE is_active = true
    `);
    
    for (const achievement of achievements) {
        // Check if already unlocked
        const alreadyUnlocked = db.query(`
            SELECT 1 FROM user_achievements
            WHERE user_id = $1 AND achievement_id = $2
        `, [userId, achievement.id]);
        
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
                const gamesCount = db.query(`
                    SELECT COUNT(*) as count FROM matches
                    WHERE user_id = $1 AND status = 'COMPLETED'
                `, [userId]);
                requirementMet = parseInt(gamesCount.count) >= achievement.requirement_value;
                break;
                
            case 'CORRECT_ANSWERS':
                const correctCount = db.query(`
                    SELECT COUNT(*) as count FROM user_answers ua
                    JOIN matches m ON m.id = ua.match_id
                    WHERE m.user_id = $1 AND ua.is_correct = true
                `, [userId]);
                requirementMet = parseInt(correctCount.count) >= achievement.requirement_value;
                break;
                
            // Add more cases as needed
        }
        
        if (requirementMet) {
            // Unlock achievement
            db.query(`
                INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                VALUES ($1, $2, CURRENT_TIMESTAMP)
            `, [userId, achievement.id]);
            
            // Add XP reward
            if (achievement.xp_reward > 0) {
                updateUserXP(userId, achievement.xp_reward);
            }
            
            unlockedAchievements.push(achievement);
        }
    }
    
    return unlockedAchievements;
}
```

### 9.3. به‌روزرسانی Leaderboard

**Logic:**
```typescript
function updateLeaderboard(): void {
    // Update all-time leaderboard
    db.query(`
        INSERT INTO leaderboard (
            user_id, rank_position, total_score, level, xp,
            period_type, period_start, updated_at
        )
        SELECT 
            u.id,
            ROW_NUMBER() OVER (ORDER BY u.total_score DESC, u.xp DESC) as rank,
            u.total_score,
            u.level,
            u.xp,
            'ALL_TIME',
            '1970-01-01'::date,
            CURRENT_TIMESTAMP
        FROM users u
        WHERE u.is_active = true
        ON CONFLICT (user_id, period_type, period_start)
        DO UPDATE SET
            rank_position = EXCLUDED.rank_position,
            total_score = EXCLUDED.total_score,
            level = EXCLUDED.level,
            xp = EXCLUDED.xp,
            updated_at = CURRENT_TIMESTAMP
    `);
    
    // Update weekly leaderboard
    const weekStart = getWeekStart();
    db.query(`
        INSERT INTO leaderboard (
            user_id, rank_position, total_score, level, xp,
            period_type, period_start, period_end, updated_at
        )
        SELECT 
            u.id,
            ROW_NUMBER() OVER (ORDER BY u.total_score DESC, u.xp DESC) as rank,
            u.total_score,
            u.level,
            u.xp,
            'WEEKLY',
            $1::date,
            ($1::date + INTERVAL '7 days')::date,
            CURRENT_TIMESTAMP
        FROM users u
        WHERE u.is_active = true
        ON CONFLICT (user_id, period_type, period_start)
        DO UPDATE SET
            rank_position = EXCLUDED.rank_position,
            total_score = EXCLUDED.total_score,
            level = EXCLUDED.level,
            xp = EXCLUDED.xp,
            updated_at = CURRENT_TIMESTAMP
    `, [weekStart]);
}
```

---

## 🔄 State Machine - وضعیت‌های بازی

```
INITIAL
  ↓
[startGame()]
  ↓
ACTIVE
  ↓
[selectQuestions()]
  ↓
[showQuestion()] → [timer starts]
  ↓
[submitAnswer()] OR [timeout()]
  ↓
[checkProgress()]
  ↓
{all questions answered?}
  ├─ NO → [showQuestion()] (next question)
  └─ YES → [endGame()]
         ↓
      COMPLETED
         ↓
      [updateStats()]
      [checkAchievements()]
      [updateLeaderboard()]
```

---

## 📊 Data Structures

### Types/Interfaces

```typescript
interface GameSession {
    id: number;
    userId: number;
    gameMode: 'SINGLE_PLAYER' | 'MULTI_PLAYER';
    categoryId: number | null;
    difficulty: string;
    questionsCount: number;
    status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED' | 'TIMED_OUT';
    startedAt: Date;
    endedAt: Date | null;
    totalScore: number;
    correctAnswers: number;
    wrongAnswers: number;
}

interface Question {
    id: number;
    questionText: string;
    difficulty: string;
    points: number;
    explanation: string;
    options: QuestionOption[];
}

interface QuestionOption {
    id: number;
    optionText: string;
    optionOrder: number;
    isCorrect: boolean;
}

interface AnswerResult {
    answerId: number;
    isCorrect: boolean;
    correctOptionId: number;
    pointsEarned: number;
    explanation: string;
}

interface GameResult {
    sessionId: number;
    userId: number;
    totalScore: number;
    correctAnswers: number;
    wrongAnswers: number;
    accuracy: number;
    timeSpent: number;
    newAchievements: Achievement[];
    opponentResult: GameResult | null;
    isWinner: boolean | null;
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
```

---

## 🎯 API Endpoints پیشنهادی

```typescript
// 1. Start Game
POST /api/game/start
Body: StartGameRequest
Response: GameSession

// 2. Get Current Question
GET /api/game/:sessionId/question
Response: CurrentQuestion

// 3. Submit Answer
POST /api/game/:sessionId/answer
Body: SubmitAnswerRequest
Response: AnswerResult

// 4. Get Game Progress
GET /api/game/:sessionId/progress
Response: GameProgress

// 5. End Game
POST /api/game/:sessionId/end
Response: GameResult

// 6. Get Game Result
GET /api/game/:sessionId/result
Response: GameResult

// 7. Handle Timeout
POST /api/game/:sessionId/timeout
Body: { questionId: number }
Response: { success: boolean }
```

---

این منطق کامل بازی است که می‌تواند مستقیماً به کد تبدیل شود. تمام مراحل با جزئیات کامل و قابل پیاده‌سازی هستند.

