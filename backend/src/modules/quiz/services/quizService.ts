import { quizSessionRepository, Match } from '../repositories/quizSessionRepository';
import { quizAnswerRepository } from '../repositories/quizAnswerRepository';
import { questionRepository, QuestionWithOptions } from '../../questions/repositories/questionRepository';
import { scoringService } from './scoringService';
import { xpService } from '../../progress/services/xpService';
import { NotFoundError, ValidationError } from '../../../shared/utils/errors';
import { pool } from '../../../shared/database/connection';

export interface StartQuizDto {
  userId: number;
  categoryId?: number | null;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | 'MIXED';
  questionsCount?: number;
  gameMode?: 'SINGLE_PLAYER' | 'MULTI_PLAYER' | 'PRACTICE';
}

export interface SubmitAnswerDto {
  matchId: number;
  questionId: number;
  selectedOptionId: number;
  timeTaken: number;
}

export const quizService = {
  async startQuiz(dto: StartQuizDto): Promise<{
    match: Match;
    questions: QuestionWithOptions[];
  }> {
    // Check for active game (skip for practice mode)
    if (dto.gameMode !== 'PRACTICE') {
      const activeMatch = await quizSessionRepository.findActiveByUserId(dto.userId);
      if (activeMatch) {
        throw new ValidationError('User already has an active game');
      }
    }

    const questionsCount = dto.questionsCount || 10;
    const difficulty = dto.difficulty || 'MIXED';
    const gameMode = dto.gameMode || 'SINGLE_PLAYER';
    const isPractice = gameMode === 'PRACTICE';

    // Get random questions
    const questions = await questionRepository.getQuestionsWithOptions(
      dto.categoryId || null,
      difficulty === 'MIXED' ? null : difficulty,
      questionsCount
    );

    if (questions.length < questionsCount) {
      throw new ValidationError(
        `Not enough questions available. Found: ${questions.length}, Required: ${questionsCount}`
      );
    }

    // Create match
    const match = await quizSessionRepository.create({
      user_id: dto.userId,
      category_id: dto.categoryId || null,
      difficulty,
      questions_count: questionsCount,
      is_practice: isPractice,
      game_mode: gameMode,
    });

    // Add questions to match
    const questionIds = questions.map((q) => q.id);
    await quizSessionRepository.addQuestions(match.id, questionIds);

    return {
      match,
      questions: questions.slice(0, questionsCount),
    };
  },

  async getCurrentQuestion(matchId: number, userId: number): Promise<{
    question: QuestionWithOptions;
    questionNumber: number;
    totalQuestions: number;
  } | null> {
    const match = await quizSessionRepository.findById(matchId);
    if (!match || match.user_id !== userId) {
      throw new NotFoundError('Match');
    }

    if (match.status !== 'ACTIVE') {
      throw new ValidationError('Match is not active');
    }

    // Get answered questions count
    const answers = await quizAnswerRepository.getAnswersByMatch(matchId);
    const answeredCount = answers.length;

    if (answeredCount >= match.questions_count) {
      return null; // All questions answered
    }

    // Get current question
    const matchQuestions = await quizSessionRepository.getQuestions(matchId);
    const currentMatchQuestion = matchQuestions[answeredCount];

    if (!currentMatchQuestion) {
      return null;
    }

    const question = await questionRepository.findById(currentMatchQuestion.question_id);
    if (!question) {
      throw new NotFoundError('Question');
    }

    const options = await questionRepository.getOptions(question.id);
    const shuffledOptions = [...options].sort(() => Math.random() - 0.5);

    return {
      question: {
        ...question,
        options: shuffledOptions.map((opt) => ({
          id: opt.id,
          option_text: opt.option_text,
          option_order: opt.option_order,
        })),
      },
      questionNumber: answeredCount + 1,
      totalQuestions: match.questions_count,
    };
  },

  async submitAnswer(dto: SubmitAnswerDto, userId: number): Promise<{
    isCorrect: boolean;
    pointsEarned: number;
    xpEarned: number;
    explanation?: string;
    isComplete: boolean;
  }> {
    const match = await quizSessionRepository.findById(dto.matchId);
    if (!match || match.user_id !== userId) {
      throw new NotFoundError('Match');
    }

    if (match.status !== 'ACTIVE') {
      throw new ValidationError('Match is not active');
    }

    // Check if already answered
    const existingAnswer = await quizAnswerRepository.findByMatchAndQuestion(
      dto.matchId,
      dto.questionId
    );
    if (existingAnswer) {
      throw new ValidationError('Question already answered');
    }

    // Validate time (skip for practice mode)
    if (!match.is_practice && (dto.timeTaken < 0 || dto.timeTaken > 35)) {
      throw new ValidationError('Invalid answer time');
    }

    // Get question and correct answer
    const question = await questionRepository.findById(dto.questionId);
    if (!question) {
      throw new NotFoundError('Question');
    }

    const options = await questionRepository.getOptions(dto.questionId);
    const correctOption = options.find((opt) => opt.is_correct);
    if (!correctOption) {
      throw new Error('Correct answer not found');
    }

    const isCorrect = dto.selectedOptionId === correctOption.id;

    // Calculate points (0 for practice mode)
    const pointsEarned = match.is_practice
      ? 0
      : isCorrect
      ? scoringService.calculatePoints(question, dto.timeTaken)
      : 0;

    // Calculate XP (0 for practice mode)
    const xpEarned = match.is_practice
      ? 0
      : scoringService.calculateXP(question, isCorrect, dto.timeTaken);

    // Save answer
    await quizAnswerRepository.create({
      match_id: dto.matchId,
      question_id: dto.questionId,
      selected_option_id: dto.selectedOptionId,
      user_answer_text: null,
      is_correct: isCorrect,
      time_taken: dto.timeTaken,
      points_earned: pointsEarned,
    });

    // Update match score (only if not practice)
    if (!match.is_practice && pointsEarned > 0) {
      await quizSessionRepository.updateScore(dto.matchId, pointsEarned);
    }

    // Update user XP (only if not practice)
    if (!match.is_practice && xpEarned > 0) {
      await xpService.addXP(userId, xpEarned);
    }

    // Update user total score
    if (!match.is_practice && pointsEarned > 0) {
      await pool.query(
        `UPDATE users
         SET total_score = total_score + ?
         WHERE id = ?`,
        [pointsEarned, userId]
      );
    }

    // Check if game is complete
    const answers = await quizAnswerRepository.getAnswersByMatch(dto.matchId);
    const isComplete = answers.length >= match.questions_count;

    if (isComplete) {
      const timeSpent = Math.floor(
        (new Date().getTime() - match.started_at.getTime()) / 1000
      );
      await quizSessionRepository.endSession(dto.matchId, timeSpent);
    }

    return {
      isCorrect,
      pointsEarned,
      xpEarned,
      explanation: question.explanation,
      isComplete,
    };
  },

  async getMatchResult(matchId: number, userId: number): Promise<{
    match: Match;
    totalScore: number;
    correctAnswers: number;
    wrongAnswers: number;
    accuracy: number;
    timeSpent: number;
  }> {
    const match = await quizSessionRepository.findById(matchId);
    if (!match || match.user_id !== userId) {
      throw new NotFoundError('Match');
    }

    const answers = await quizAnswerRepository.getAnswersByMatch(matchId);
    const correctAnswers = answers.filter((a) => a.is_correct).length;
    const wrongAnswers = answers.filter((a) => !a.is_correct).length;
    const totalAnswers = correctAnswers + wrongAnswers;
    const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

    const timeSpent = match.time_spent || Math.floor(
      (new Date().getTime() - match.started_at.getTime()) / 1000
    );

    return {
      match,
      totalScore: match.total_score,
      correctAnswers,
      wrongAnswers,
      accuracy: Math.round(accuracy * 100) / 100,
      timeSpent,
    };
  },
};

