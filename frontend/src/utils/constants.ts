export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  QUIZ: {
    START: '/quiz/start',
    CURRENT_QUESTION: (sessionId: number) => `/quiz/${sessionId}/current-question`,
    SUBMIT_ANSWER: (sessionId: number) => `/quiz/${sessionId}/answer`,
    END: (sessionId: number) => `/quiz/${sessionId}/end`,
  },
  QUESTIONS: {
    RANDOM: '/questions/random',
    CATEGORIES: '/questions/categories',
    BY_ID: (id: number) => `/questions/${id}`,
  },
  LEADERBOARD: {
    GLOBAL: '/leaderboard/global',
    WEEKLY: '/leaderboard/weekly',
    CATEGORY: (categoryId: number) => `/leaderboard/category/${categoryId}`,
    USER_RANK: (userId: number) => `/leaderboard/user/${userId}/rank`,
  },
  USERS: {
    PROFILE: '/users/profile',
  },
} as const;

export const GAME_CONSTANTS = {
  DEFAULT_QUESTION_COUNT: 10,
  MIN_QUESTION_COUNT: 5,
  MAX_QUESTION_COUNT: 50,
  DEFAULT_TIME_LIMIT: 30,
  MAX_TIME_LIMIT: 35,
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'quiz_game_token',
  REFRESH_TOKEN: 'quiz_game_refresh_token',
  USER: 'quiz_game_user',
} as const;

