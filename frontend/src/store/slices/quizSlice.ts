import { create } from 'zustand';
import { Question } from '@/services/api/quizApi';

interface QuizState {
  matchId: number | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<number, { optionId: number; timeTaken: number }>;
  score: number;
  isComplete: boolean;
  setMatch: (matchId: number, questions: Question[]) => void;
  setCurrentQuestionIndex: (index: number) => void;
  addAnswer: (questionId: number, optionId: number, timeTaken: number) => void;
  setScore: (score: number) => void;
  setComplete: () => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  matchId: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  score: 0,
  isComplete: false,
  setMatch: (matchId, questions) =>
    set({ matchId, questions, currentQuestionIndex: 0, answers: {}, score: 0, isComplete: false }),
  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
  addAnswer: (questionId, optionId, timeTaken) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: { optionId, timeTaken } },
    })),
  setScore: (score) => set({ score }),
  setComplete: () => set({ isComplete: true }),
  reset: () =>
    set({
      matchId: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      score: 0,
      isComplete: false,
    }),
}));



