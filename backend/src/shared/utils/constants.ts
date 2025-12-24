export const DIFFICULTY_MULTIPLIERS = {
  EASY: 1.0,
  MEDIUM: 1.5,
  HARD: 2.0,
  EXPERT: 3.0,
} as const;

export const BASE_XP = {
  EASY: 10,
  MEDIUM: 20,
  HARD: 30,
  EXPERT: 50,
} as const;

export const TIME_BONUS_THRESHOLDS = {
  FAST: 5, // seconds
  MEDIUM: 10,
  NORMAL: 20,
  SLOW: 25,
} as const;

export const TIME_BONUS_MULTIPLIERS = {
  VERY_FAST: 2.0, // <= 5 seconds
  FAST: 1.5, // <= 10 seconds
  MEDIUM: 1.3, // <= 15 seconds
  NORMAL: 1.1, // <= 20 seconds
  SLOW: 1.0, // <= 25 seconds
  VERY_SLOW: 0.8, // > 25 seconds
} as const;

export const DEFAULT_QUESTION_COUNT = 10;
export const MIN_QUESTION_COUNT = 5;
export const MAX_QUESTION_COUNT = 50;
export const DEFAULT_TIME_LIMIT = 30; // seconds
export const MAX_TIME_LIMIT = 35; // seconds

export const LEVEL_XP_BASE = 100;

