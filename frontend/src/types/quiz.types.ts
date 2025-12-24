export type GameMode = 'SINGLE_PLAYER' | 'MULTI_PLAYER' | 'PRACTICE';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | 'MIXED';

export interface QuizSession {
  id: number;
  userId: number;
  categoryId: number | null;
  difficulty: Difficulty;
  questionsCount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  isPractice: boolean;
  gameMode: GameMode;
}

export interface Question {
  id: number;
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
}

