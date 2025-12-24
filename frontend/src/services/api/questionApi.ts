import apiClient from './client';

export interface Question {
  id: number;
  categoryId: number;
  difficulty: string;
  questionText: string;
  explanation: string | null;
  points: number;
  options: Array<{
    id: number;
    text: string;
    order: number;
    isCorrect: boolean;
  }>;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

export interface GetRandomQuestionsParams {
  categoryId?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | 'MIXED';
  count?: number;
}

export const questionApi = {
  getRandomQuestions: async (params: GetRandomQuestionsParams): Promise<Question[]> => {
    const queryParams = new URLSearchParams();
    if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params.count) queryParams.append('count', params.count.toString());

    const response = await apiClient.get<{ success: boolean; data: Question[] }>(
      `/questions/random?${queryParams.toString()}`
    );
    return response.data.data;
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<{ success: boolean; data: Category[] }>(
      '/questions/categories'
    );
    return response.data.data;
  },

  getQuestionById: async (id: number, includeCorrectAnswer: boolean = false): Promise<Question> => {
    const response = await apiClient.get<{ success: boolean; data: Question }>(
      `/questions/${id}?includeCorrectAnswer=${includeCorrectAnswer}`
    );
    return response.data.data;
  },

  getQuestionsByCategory: async (categoryId: number): Promise<Question[]> => {
    const response = await apiClient.get<{ success: boolean; data: Question[] }>(
      `/questions/category/${categoryId}`
    );
    return response.data.data;
  },

  createQuestion: async (data: {
    categoryId: number;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
    questionText: string;
    explanation?: string | null;
    points: number;
    options: Array<{
      text: string;
      order: number;
      isCorrect: boolean;
    }>;
  }): Promise<Question> => {
    const response = await apiClient.post<{ success: boolean; data: Question }>(
      '/questions',
      data
    );
    return response.data.data;
  },

  updateQuestion: async (id: number, data: {
    categoryId?: number;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
    questionText?: string;
    explanation?: string | null;
    points?: number;
    options?: Array<{
      id?: number;
      text: string;
      order: number;
      isCorrect: boolean;
    }>;
  }): Promise<Question> => {
    const response = await apiClient.put<{ success: boolean; data: Question }>(
      `/questions/${id}`,
      data
    );
    return response.data.data;
  },

  deleteQuestion: async (id: number, hardDelete: boolean = false): Promise<void> => {
    await apiClient.delete<{ success: boolean }>(
      `/questions/${id}?hardDelete=${hardDelete}`
    );
  },
};

