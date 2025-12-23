'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/store/slices/userSlice';
import { quizApi, Question } from '@/services/api/quizApi';

interface CurrentQuestion {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useUserStore();
  const matchId = parseInt(params.matchId as string);

  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadQuestion();
    startTimer();
  }, [matchId, user, router]);

  const loadQuestion = async () => {
    try {
      const data = await quizApi.getCurrentQuestion(matchId);
      if (!data) {
        // Quiz completed
        router.push(`/quiz/${matchId}/result`);
        return;
      }
      setCurrentQuestion(data);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeRemaining(30);
    } catch (error) {
      console.error('Failed to load question:', error);
    }
  };

  const startTimer = () => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  };

  const handleTimeout = async () => {
    if (isAnswered) return;
    setIsAnswered(true);
    // Submit with timeout
    await submitAnswer(selectedOption || 0, 30);
  };

  const submitAnswer = async (optionId: number, timeTaken: number) => {
    if (!currentQuestion || isAnswered) return;

    setLoading(true);
    setIsAnswered(true);

    try {
      const result = await quizApi.submitAnswer(matchId, {
        questionId: currentQuestion.question.id,
        selectedOptionId: optionId,
        timeTaken: 30 - timeRemaining,
      });

      setScore((prev) => prev + result.pointsEarned);

      if (result.isComplete) {
        setTimeout(() => {
          router.push(`/quiz/${matchId}/result`);
        }, 2000);
      } else {
        setTimeout(() => {
          loadQuestion();
        }, 2000);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit answer');
      setIsAnswered(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (optionId: number) => {
    if (isAnswered) return;
    setSelectedOption(optionId);
    submitAnswer(optionId, 30 - timeRemaining);
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading question...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">
                Question {currentQuestion.questionNumber} of {currentQuestion.totalQuestions}
              </h2>
              <p className="text-gray-600">Score: {score}</p>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {timeRemaining}s
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {currentQuestion.question.question_text}
            </h3>
          </div>

          <div className="space-y-3">
            {currentQuestion.question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                disabled={isAnswered || loading}
                className={`w-full p-4 text-left rounded-lg border-2 transition ${
                  isAnswered && selectedOption === option.id
                    ? 'bg-blue-100 border-blue-500'
                    : 'bg-gray-50 border-gray-300 hover:border-blue-400'
                } disabled:opacity-50`}
              >
                {option.option_text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



