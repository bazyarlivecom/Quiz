import { QuizSessionRepository, QuizSession } from '../repositories/quizSessionRepository';
import { UserAnswerRepository, UserAnswer } from '../repositories/userAnswerRepository';
import { QuestionService } from '../../questions/services/questionService';
import { ScoringService } from './scoringService';
import { StartGameDto } from '../dto/startGameDto';
import { SubmitAnswerDto } from '../dto/submitAnswerDto';
import { NotFoundError, ConflictError } from '../../../shared/utils/errors';
import { db } from '../../../shared/database/connection';

export interface CurrentQuestion {
  questionId: number;
  questionText: string;
  options: Array<{
    id: number;
    text: string;
    order: number;
  }>;
  questionNumber: number;
  totalQuestions: number;
  timeLimit: number | null;
  isPractice?: boolean;
}

export interface AnswerResult {
  answerId: number;
  isCorrect: boolean;
  correctOptionId: number;
  pointsEarned: number;
  explanation: string | null;
  isPractice?: boolean;
}

export interface GameResult {
  sessionId: number;
  userId: number;
  totalScore: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  timeSpent: number;
  newAchievements: any[];
  isPractice?: boolean;
}

export class QuizService {
  private sessionRepository: QuizSessionRepository;
  private answerRepository: UserAnswerRepository;
  private questionService: QuestionService;
  private scoringService: ScoringService;

  constructor() {
    this.sessionRepository = new QuizSessionRepository();
    this.answerRepository = new UserAnswerRepository();
    this.questionService = new QuestionService();
    this.scoringService = new ScoringService();
  }

  async startGame(userId: number, dto: StartGameDto): Promise<QuizSession> {
    if (dto.gameMode !== 'PRACTICE') {
      const activeGames = await this.sessionRepository.findByUserId(userId, 'ACTIVE');
      if (activeGames.length > 0) {
        throw new ConflictError('User already has an active game');
      }
    }

    if (dto.gameMode === 'MULTI_PLAYER' && dto.opponentUserId) {
      const opponentActiveGames = await this.sessionRepository.findByUserId(
        dto.opponentUserId,
        'ACTIVE'
      );
      if (opponentActiveGames.length > 0) {
        throw new ConflictError('Opponent is already in a game');
      }
    }

    const session = await this.sessionRepository.create({
      userId,
      categoryId: dto.categoryId || null,
      difficulty: dto.difficulty,
      questionsCount: dto.questionsCount,
      gameMode: dto.gameMode,
      isPractice: dto.gameMode === 'PRACTICE',
    });

    const questions = await this.questionService.getRandomQuestions({
      categoryId: dto.categoryId || undefined,
      difficulty: dto.difficulty,
      count: dto.questionsCount,
    });

    for (let i = 0; i < questions.length; i++) {
      await this.sessionRepository.addMatchQuestion(session.id, questions[i].id, i + 1);
    }

    if (dto.gameMode === 'MULTI_PLAYER' && dto.opponentUserId) {
      const opponentSession = await this.sessionRepository.create({
        userId: dto.opponentUserId,
        categoryId: dto.categoryId || null,
        difficulty: dto.difficulty,
        questionsCount: dto.questionsCount,
        gameMode: dto.gameMode,
        parentSessionId: session.id,
      });

      for (let i = 0; i < questions.length; i++) {
        await this.sessionRepository.addMatchQuestion(opponentSession.id, questions[i].id, i + 1);
      }
    }

    return session;
  }

  async getCurrentQuestion(sessionId: number, userId: number): Promise<CurrentQuestion | null> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session || session.user_id !== userId) {
      throw new NotFoundError('Session not found or access denied');
    }

    if (session.status !== 'ACTIVE') {
      throw new ConflictError('Session is not active');
    }

    const matchQuestions = await this.sessionRepository.getMatchQuestions(sessionId);
    const answers = await this.answerRepository.getMatchAnswers(sessionId);
    const answeredCount = answers.length;

    if (answeredCount >= session.questions_count) {
      return null;
    }

    const currentMatchQuestion = matchQuestions[answeredCount];
    if (!currentMatchQuestion) {
      return null;
    }

    const question = await this.questionService.getQuestionById(currentMatchQuestion.question_id, true);
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    const shuffledOptions = this.shuffleArray(question.options);

    const isPractice = session.is_practice || false;

    return {
      questionId: question.id,
      questionText: question.question_text,
      options: shuffledOptions.map((opt) => ({
        id: opt.id,
        text: opt.option_text,
        order: opt.option_order,
      })),
      questionNumber: answeredCount + 1,
      totalQuestions: session.questions_count,
      timeLimit: isPractice ? null : 30,
      isPractice,
    };
  }

  async submitAnswer(
    sessionId: number,
    userId: number,
    dto: SubmitAnswerDto
  ): Promise<AnswerResult> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session || session.user_id !== userId) {
      throw new NotFoundError('Session not found or access denied');
    }

    if (session.status !== 'ACTIVE') {
      throw new ConflictError('Session is not active');
    }

    const existingAnswer = await this.answerRepository.findByMatchAndQuestion(
      sessionId,
      dto.questionId
    );
    if (existingAnswer) {
      throw new ConflictError('Question already answered');
    }

    const matchQuestions = await this.sessionRepository.getMatchQuestions(sessionId);
    const questionInSession = matchQuestions.find((mq) => mq.question_id === dto.questionId);
    if (!questionInSession) {
      throw new NotFoundError('Question not found in this session');
    }

    const question = await this.questionService.getQuestionById(dto.questionId, true);
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    const correctOption = question.options.find((opt) => opt.is_correct);
    if (!correctOption) {
      throw new NotFoundError('Correct answer not found');
    }

    const isCorrect = dto.selectedOptionId === correctOption.id;
    const isPractice = session.is_practice || false;

    const pointsEarned = isPractice
      ? 0
      : isCorrect
      ? this.scoringService.calculatePoints(question, dto.timeTaken || 0)
      : 0;

    const answer = await this.answerRepository.create({
      matchId: sessionId,
      questionId: dto.questionId,
      selectedOptionId: dto.selectedOptionId,
      userAnswerText: null,
      isCorrect,
      timeTaken: dto.timeTaken || 0,
      pointsEarned,
    });

    if (!isPractice) {
      await this.sessionRepository.update(sessionId, {
        totalScore: pointsEarned,
        correctAnswers: isCorrect ? 1 : 0,
        wrongAnswers: isCorrect ? 0 : 1,
      });
    } else {
      await this.sessionRepository.update(sessionId, {
        correctAnswers: isCorrect ? 1 : 0,
        wrongAnswers: isCorrect ? 0 : 1,
      });
    }

    return {
      answerId: answer.id,
      isCorrect,
      correctOptionId: correctOption.id,
      pointsEarned,
      explanation: question.explanation,
      isPractice,
    };
  }

  async endGame(sessionId: number, userId: number): Promise<GameResult> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session || session.user_id !== userId) {
      throw new NotFoundError('Session not found or access denied');
    }

    if (session.status !== 'ACTIVE') {
      throw new ConflictError('Session is not active');
    }

    const answers = await this.answerRepository.getMatchAnswers(sessionId);
    const stats = this.calculateFinalStats(answers);

    const timeSpent = Math.floor(
      (new Date().getTime() - new Date(session.started_at).getTime()) / 1000
    );

    const isPractice = session.is_practice || false;

    if (!isPractice) {
      await db.query(`UPDATE users SET total_score = total_score + $1 WHERE id = $2`, [
        stats.totalScore,
        userId,
      ]);
    }

    await this.sessionRepository.update(sessionId, {
      status: 'COMPLETED',
      endedAt: new Date(),
      timeSpent,
    });

    return {
      sessionId,
      userId,
      totalScore: isPractice ? 0 : stats.totalScore,
      correctAnswers: stats.correctAnswers,
      wrongAnswers: stats.wrongAnswers,
      accuracy: stats.accuracy,
      timeSpent,
      newAchievements: [],
      isPractice,
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

  private calculateFinalStats(answers: UserAnswer[]): {
    totalScore: number;
    correctAnswers: number;
    wrongAnswers: number;
    accuracy: number;
  } {
    const totalScore = answers.reduce((sum, a) => sum + a.points_earned, 0);
    const correctAnswers = answers.filter((a) => a.is_correct).length;
    const wrongAnswers = answers.filter((a) => !a.is_correct).length;
    const totalAnswers = correctAnswers + wrongAnswers;
    const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

    return {
      totalScore,
      correctAnswers,
      wrongAnswers,
      accuracy: Math.round(accuracy * 100) / 100,
    };
  }
}

