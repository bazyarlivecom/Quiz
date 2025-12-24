import apiClient from './client';

export interface StartGameRequest {
  gameMode: 'SINGLE_PLAYER' | 'MULTI_PLAYER' | 'PRACTICE';
  categoryId?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | 'MIXED';
  questionsCount?: number;
  opponentUserId?: number;
}

export interface SubmitAnswerRequest {
  questionId: number;
  selectedOptionId: number;
  timeTaken: number;
}

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

export const quizApi = {
  startGame: async (data: StartGameRequest) => {
    const response = await apiClient.post<{ success: boolean; data: { sessionId: number; status: string } }>(
      '/quiz/start',
      data
    );
    return response.data.data;
  },

  getCurrentQuestion: async (sessionId: number): Promise<CurrentQuestion> => {
    const response = await apiClient.get<{ success: boolean; data: CurrentQuestion }>(
      `/quiz/${sessionId}/current-question`
    );
    return response.data.data;
  },

  submitAnswer: async (sessionId: number, data: SubmitAnswerRequest): Promise<AnswerResult> => {
    const response = await apiClient.post<{ success: boolean; data: AnswerResult }>(
      `/quiz/${sessionId}/answer`,
      data
    );
    return response.data.data;
  },

  endGame: async (sessionId: number): Promise<GameResult> => {
    const response = await apiClient.post<{ success: boolean; data: GameResult }>(
      `/quiz/${sessionId}/end`
    );
    return response.data.data;
  },
};

