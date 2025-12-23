# جزئیات ماژول‌ها و مسئولیت‌ها

## 📦 ماژول‌های Backend

### 1. ماژول Authentication (`modules/auth/`)

#### `controllers/authController.ts`
```typescript
// مسئولیت: Handle HTTP requests/responses
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- GET /api/auth/me
```

**Functions:**
- `register()`: دریافت registerDto → validate → call authService → return token
- `login()`: دریافت loginDto → validate → call authService → return token
- `logout()`: invalidate token → clear session
- `refresh()`: validate refresh token → generate new access token
- `getMe()`: return current user info

#### `services/authService.ts`
```typescript
// مسئولیت: Business logic برای authentication
- Validate user credentials
- Hash passwords
- Generate JWT tokens
- Manage sessions
```

**Functions:**
- `registerUser(dto)`: 
  - Check if user exists
  - Hash password
  - Create user in DB
  - Generate tokens
  - Return user + tokens
  
- `loginUser(dto)`:
  - Find user by email
  - Verify password
  - Generate tokens
  - Update last login
  - Return user + tokens

- `validateToken(token)`: Verify JWT و return payload

#### `repositories/userRepository.ts`
```typescript
// مسئولیت: Database operations برای users
- CRUD operations
- Query users
```

**Functions:**
- `findByEmail(email)`: Find user by email
- `findById(id)`: Find user by ID
- `create(userData)`: Create new user
- `update(id, userData)`: Update user
- `delete(id)`: Delete user

#### `dto/loginDto.ts`
```typescript
// مسئولیت: Type definition و validation schema
export interface LoginDto {
  email: string;
  password: string;
}

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
```

---

### 2. ماژول Quiz (`modules/quiz/`)

#### `services/quizService.ts`
```typescript
// مسئولیت: مدیریت Quiz Session
- Create new quiz session
- Load questions
- Manage session state
- End session
```

**Functions:**
- `createSession(userId, categoryId, difficulty)`:
  - Get random questions (10 questions)
  - Create QuizSession record
  - Store questions in session
  - Return sessionId + questions

- `getSession(sessionId)`:
  - Load session from DB
  - Return session state

- `submitAnswer(sessionId, questionId, answer, timeTaken)`:
  - Validate session is active
  - Check if answer is correct
  - Calculate points (via scoringService)
  - Save answer
  - Update session score
  - Return result

- `endSession(sessionId)`:
  - Calculate final score
  - Update user XP (via progressService)
  - Mark session as completed
  - Return final results

#### `services/scoringService.ts`
```typescript
// مسئولیت: محاسبه امتیاز
- Calculate points based on answer correctness
- Apply time bonus
- Apply difficulty multiplier
```

**Functions:**
- `calculatePoints(question, isCorrect, timeTaken)`:
  ```typescript
  if (!isCorrect) return 0;
  
  const basePoints = question.points;
  const difficultyMultiplier = getDifficultyMultiplier(question.difficulty);
  const timeBonus = calculateTimeBonus(timeTaken);
  
  return Math.round(basePoints * difficultyMultiplier * timeBonus);
  ```

- `calculateTimeBonus(timeTaken)`:
  ```typescript
  if (timeTaken <= 5) return 1.5;
  if (timeTaken <= 10) return 1.3;
  if (timeTaken <= 20) return 1.1;
  return 1.0;
  ```

- `getDifficultyMultiplier(difficulty)`:
  ```typescript
  const multipliers = {
    EASY: 1.0,
    MEDIUM: 1.5,
    HARD: 2.0,
    EXPERT: 3.0,
  };
  return multipliers[difficulty];
  ```

#### `services/timerService.ts`
```typescript
// مسئولیت: Validation تایمر (prevent cheating)
- Validate answer time
- Check for suspicious patterns
```

**Functions:**
- `validateAnswerTime(sessionId, questionId, submittedTime)`:
  - Get question start time from session
  - Calculate elapsed time
  - Check if time is reasonable (not too fast, not expired)
  - Return validation result

- `recordQuestionStart(sessionId, questionId)`: Store question start time

#### `repositories/quizSessionRepository.ts`
```typescript
// مسئولیت: Database operations برای quiz sessions
```

**Functions:**
- `create(sessionData)`: Create new session
- `findById(id)`: Find session by ID
- `findByUserId(userId)`: Find user's active sessions
- `update(id, updates)`: Update session
- `endSession(id)`: Mark session as completed

#### `repositories/quizAnswerRepository.ts`
```typescript
// مسئولیت: Database operations برای answers
```

**Functions:**
- `create(answerData)`: Save answer
- `findBySessionId(sessionId)`: Get all answers for session
- `findByQuestionId(questionId)`: Get answers for question (stats)

---

### 3. ماژول Progress (`modules/progress/`)

#### `services/levelService.ts`
```typescript
// مسئولیت: مدیریت Level و XP
- Calculate level from XP
- Check level up
- Calculate XP required for next level
```

**Functions:**
- `calculateLevel(xp)`:
  ```typescript
  // Formula: level = floor(sqrt(xp / 100)) + 1
  return Math.floor(Math.sqrt(xp / 100)) + 1;
  ```

- `getXPForLevel(level)`:
  ```typescript
  // Formula: (level - 1)² × 100
  return Math.pow(level - 1, 2) * 100;
  ```

- `getXPForNextLevel(currentLevel)`:
  ```typescript
  const nextLevel = currentLevel + 1;
  return getXPForLevel(nextLevel);
  ```

- `checkLevelUp(oldXP, newXP)`:
  ```typescript
  const oldLevel = calculateLevel(oldXP);
  const newLevel = calculateLevel(newXP);
  return {
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
  };
  ```

#### `services/xpService.ts`
```typescript
// مسئولیت: مدیریت XP
- Calculate XP for correct answer
- Add XP to user
- Handle XP bonuses
```

**Functions:**
- `calculateXPForAnswer(question, isCorrect, timeTaken)`:
  ```typescript
  if (!isCorrect) return 0;
  
  const baseXP = {
    EASY: 10,
    MEDIUM: 20,
    HARD: 30,
    EXPERT: 50,
  }[question.difficulty];
  
  const timeBonus = timeTaken < 5 ? 0.2 : 0;
  return Math.round(baseXP * (1 + timeBonus));
  ```

- `addXP(userId, xpAmount)`:
  - Get current user XP
  - Add new XP
  - Check for level up
  - Update user record
  - Return level up info

#### `services/achievementService.ts`
```typescript
// مسئولیت: مدیریت دستاوردها
- Check achievement requirements
- Unlock achievements
- Get user achievements
```

**Functions:**
- `checkAchievements(userId, eventType, eventData)`:
  - Get all achievements
  - Check which ones user qualifies for
  - Unlock new achievements
  - Return unlocked achievements

- `getUserAchievements(userId)`: Get all unlocked achievements

---

### 4. ماژول Questions (`modules/questions/`)

#### `services/questionService.ts`
```typescript
// مسئولیت: مدیریت سوالات
- Get random questions
- Filter questions
- Validate questions
```

**Functions:**
- `getRandomQuestions(categoryId, difficulty, count)`:
  - Query questions from DB
  - Randomize order
  - Return questions (without correct answer initially)

- `getQuestionById(id)`: Get single question

- `validateQuestion(question)`: Validate question structure

#### `repositories/questionRepository.ts`
```typescript
// مسئولیت: Database operations برای questions
```

**Functions:**
- `findRandom(categoryId, difficulty, count)`: Get random questions
- `findById(id)`: Get question by ID
- `findByCategory(categoryId)`: Get questions by category
- `create(questionData)`: Create new question
- `update(id, questionData)`: Update question
- `delete(id)`: Delete question

---

### 5. ماژول Leaderboard (`modules/leaderboard/`)

#### `services/leaderboardService.ts`
```typescript
// مسئولیت: مدیریت Leaderboard
- Get global leaderboard
- Get category leaderboard
- Get weekly/monthly leaderboards
- Cache leaderboard data
```

**Functions:**
- `getGlobalLeaderboard(limit, offset)`:
  - Get from Redis cache if available
  - Otherwise query DB
  - Cache result
  - Return ranked users

- `getCategoryLeaderboard(categoryId, limit, offset)`:
  - Similar to global but filtered by category

- `getWeeklyLeaderboard()`: Get top users for current week

- `updateLeaderboard(userId, score)`: Update user's position

#### `repositories/leaderboardRepository.ts`
```typescript
// مسئولیت: Database operations برای leaderboard
```

**Functions:**
- `getTopUsers(limit, offset)`: Get top users by total_score
- `getUserRank(userId)`: Get user's rank
- `getCategoryTopUsers(categoryId, limit)`: Get top users for category

---

## 🔗 روابط بین ماژول‌ها

### جریان شروع بازی:

```
1. Frontend: quizApi.startQuiz()
   ↓
2. Backend: quizController.startQuiz()
   ↓
3. quizService.createSession()
   ├─→ questionService.getRandomQuestions()
   │   └─→ questionRepository.findRandom()
   ├─→ quizSessionRepository.create()
   └─→ Return session
   ↓
4. Frontend: Display questions
```

### جریان پاسخ دادن:

```
1. Frontend: quizApi.submitAnswer()
   ↓
2. Backend: quizController.submitAnswer()
   ↓
3. quizService.submitAnswer()
   ├─→ timerService.validateAnswerTime()
   ├─→ scoringService.calculatePoints()
   ├─→ quizAnswerRepository.create()
   ├─→ xpService.addXP()
   │   └─→ levelService.checkLevelUp()
   └─→ Return result
   ↓
4. Frontend: Update UI (score, XP, level)
```

### جریان پایان بازی:

```
1. Frontend: quizApi.endQuiz()
   ↓
2. Backend: quizController.endQuiz()
   ↓
3. quizService.endSession()
   ├─→ Calculate final score
   ├─→ progressService.updateProgress()
   ├─→ achievementService.checkAchievements()
   ├─→ leaderboardService.updateLeaderboard()
   └─→ Return final results
   ↓
4. Frontend: Show results screen
```

---

## 📝 Shared Utilities

### `shared/utils/jwt.ts`
```typescript
// مسئولیت: JWT token management
- generateToken(payload, expiresIn)
- verifyToken(token)
- decodeToken(token)
```

### `shared/utils/bcrypt.ts`
```typescript
// مسئولیت: Password hashing
- hashPassword(password)
- comparePassword(password, hash)
```

### `shared/utils/validators.ts`
```typescript
// مسئولیت: Validation schemas (Zod)
- loginSchema
- registerSchema
- startQuizSchema
- submitAnswerSchema
```

### `shared/middleware/auth.ts`
```typescript
// مسئولیت: Authentication middleware
- Extract token from header
- Verify token
- Attach user to request
- Handle unauthorized requests
```

### `shared/middleware/errorHandler.ts`
```typescript
// مسئولیت: Global error handling
- Catch all errors
- Format error response
- Log errors
- Return appropriate status code
```

---

## 🗄️ Database Models

### User Model
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  level: number;
  xp: number;
  totalScore: number;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Question Model
```typescript
interface Question {
  id: number;
  categoryId: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  questionText: string;
  correctAnswer: string;
  wrongAnswers: string[]; // Array of 3
  explanation?: string;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### QuizSession Model
```typescript
interface QuizSession {
  id: number;
  userId: number;
  categoryId: number;
  difficulty: string;
  startedAt: Date;
  endedAt?: Date;
  totalScore: number;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  questionsCount: number;
}
```

### QuizAnswer Model
```typescript
interface QuizAnswer {
  id: number;
  sessionId: number;
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  timeTaken: number; // seconds
  pointsEarned: number;
  answeredAt: Date;
}
```

---

## 🔐 Security Considerations

### در هر ماژول:

1. **Input Validation**: تمام inputs با Zod validate می‌شوند
2. **SQL Injection**: استفاده از Parameterized Queries
3. **XSS**: Sanitize user inputs
4. **Rate Limiting**: محدود کردن requests
5. **Authentication**: بررسی token در protected routes
6. **Authorization**: بررسی permissions
7. **Timer Validation**: جلوگیری از cheating در timer
8. **Data Sanitization**: Sanitize قبل از save در DB

---

## 🧪 Testing Strategy

### Unit Tests:
- هر service function به صورت جداگانه
- Mock dependencies
- Test edge cases

### Integration Tests:
- Test interaction بین modules
- Test database operations
- Test API endpoints

### E2E Tests:
- Test complete user flows
- Test authentication flow
- Test quiz flow

---

این ساختار ماژولار باعث می‌شود:
- کد قابل نگهداری باشد
- تست کردن آسان باشد
- توسعه تیمی راحت باشد
- Scalability داشته باشد

