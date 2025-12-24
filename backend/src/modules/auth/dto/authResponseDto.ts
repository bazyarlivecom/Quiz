export interface AuthResponseDto {
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

