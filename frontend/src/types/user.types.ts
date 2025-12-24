export interface User {
  id: number;
  username: string;
  email: string;
  level: number;
  xp: number;
  totalScore: number;
  avatarUrl: string | null;
}

export interface UserProfile extends User {
  createdAt?: Date;
  updatedAt?: Date;
}

