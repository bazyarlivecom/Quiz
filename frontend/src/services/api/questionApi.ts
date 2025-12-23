import apiClient from './client';

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export const questionApi = {
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get('/questions/categories');
    return response.data.data;
  },

  async getRandomQuestions(params: {
    categoryId?: number | null;
    difficulty?: string;
    count?: number;
  }) {
    const response = await apiClient.get('/questions/random', { params });
    return response.data.data;
  },
};



