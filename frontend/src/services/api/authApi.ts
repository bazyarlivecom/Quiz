import apiClient from './client';

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface LoginDto {
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
  };
  token: string;
  refreshToken: string;
}

export const authApi = {
  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', data);
    return response.data.data;
  },

  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', data);
    return response.data.data;
  },

  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },
};



