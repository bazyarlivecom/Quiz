import apiClient from './client';

export interface StartQuizDto {
  categoryId?: number | null;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | 'MIXED';
  questionsCount?: number;
  gameMode?: 'SINGLE_PLAYER' | 'MULTI_PLAYER' | 'PRACTICE';
}

export interface QuestionOption {
  id: number;
  option_text: string;
  option_order: number;
}

export interface Question {
  id: number;
  question_text: string;
  difficulty: string;
  points: number;
  options: QuestionOption[];
}

export interface SubmitAnswerDto {
  questionId: number;
  selectedOptionId: number;
  timeTaken: number;
}

export const quizApi = {
  async startQuiz(data: StartQuizDto) {
    const response = await apiClient.post('/quiz/start', data);
    return response.data.data;
  },

  async getCurrentQuestion(matchId: number) {
    const response = await apiClient.get(`/quiz/${matchId}/question`);
    return response.data.data;
  },

  async submitAnswer(matchId: number, data: SubmitAnswerDto) {
    const response = await apiClient.post(`/quiz/${matchId}/answer`, data);
    return response.data.data;
  },

  async getResult(matchId: number) {
    const response = await apiClient.get(`/quiz/${matchId}/result`);
    return response.data.data;
  },
};



