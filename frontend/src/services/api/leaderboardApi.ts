import apiClient from './client';

export interface LeaderboardEntry {
  userId: number;
  username: string;
  totalScore: number;
  level: number;
  rank: number;
}

export const leaderboardApi = {
  getGlobal: async (limit: number = 100, offset: number = 0): Promise<LeaderboardEntry[]> => {
    const response = await apiClient.get<{ success: boolean; data: LeaderboardEntry[] }>(
      `/leaderboard/global?limit=${limit}&offset=${offset}`
    );
    return response.data.data;
  },

  getWeekly: async (limit: number = 100): Promise<LeaderboardEntry[]> => {
    const response = await apiClient.get<{ success: boolean; data: LeaderboardEntry[] }>(
      `/leaderboard/weekly?limit=${limit}`
    );
    return response.data.data;
  },

  getCategory: async (categoryId: number, limit: number = 100): Promise<LeaderboardEntry[]> => {
    const response = await apiClient.get<{ success: boolean; data: LeaderboardEntry[] }>(
      `/leaderboard/category/${categoryId}?limit=${limit}`
    );
    return response.data.data;
  },

  getUserRank: async (userId: number): Promise<{ userId: number; rank: number | null }> => {
    const response = await apiClient.get<{ success: boolean; data: { userId: number; rank: number | null } }>(
      `/leaderboard/user/${userId}/rank`
    );
    return response.data.data;
  },
};

