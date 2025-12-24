import { create } from 'zustand';
import { QuizSession, Question, AnswerResult, GameResult } from '../../types/quiz.types';

interface QuizState {
  currentSession: QuizSession | null;
  currentQuestion: Question | null;
  answers: AnswerResult[];
  score: number;
  timeRemaining: number | null;
  isAnswering: boolean;
  setSession: (session: QuizSession | null) => void;
  setQuestion: (question: Question | null) => void;
  addAnswer: (answer: AnswerResult) => void;
  updateScore: (points: number) => void;
  setTimeRemaining: (time: number | null) => void;
  setIsAnswering: (isAnswering: boolean) => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  currentSession: null,
  currentQuestion: null,
  answers: [],
  score: 0,
  timeRemaining: null,
  isAnswering: false,
  setSession: (session) => set({ currentSession: session }),
  setQuestion: (question) => set({ currentQuestion: question }),
  addAnswer: (answer) =>
    set((state) => ({
      answers: [...state.answers, answer],
      score: state.score + answer.pointsEarned,
    })),
  updateScore: (points) => set((state) => ({ score: state.score + points })),
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setIsAnswering: (isAnswering) => set({ isAnswering }),
  reset: () =>
    set({
      currentSession: null,
      currentQuestion: null,
      answers: [],
      score: 0,
      timeRemaining: null,
      isAnswering: false,
    }),
}));

