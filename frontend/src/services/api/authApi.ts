import apiClient from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    username: string;
    email: string;
    level: number;
    xp: number;
    totalScore: number;
    avatarUrl: string | null;
  };
  token: string;
  refreshToken: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
      '/auth/login',
      data
    );
    return response.data.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
      '/auth/register',
      data
    );
    return response.data.data;
  },

  getMe: async () => {
    const response = await apiClient.get<{ success: boolean; data: any }>('/auth/me');
    return response.data.data;
  },

  refresh: async (refreshToken: string) => {
    const response = await apiClient.post<{ success: boolean; data: { token: string; refreshToken: string } }>(
      '/auth/refresh',
      { refreshToken }
    );
    return response.data.data;
  },
};

