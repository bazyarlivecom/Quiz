'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '../../../../components/layout/ProtectedRoute';
import { useAuth } from '../../../../hooks/useAuth';
import { quizApi } from '../../../../services/api/quizApi';
import { useQuizStore } from '../../../../store/slices/quizSlice';
import { useTimer } from '../../../../hooks/useTimer';
import QuestionCard from '../../../../components/quiz/QuestionCard';
import QuizTimer from '../../../../components/quiz/QuizTimer';
import { Question, AnswerResult } from '../../../../types/quiz.types';

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const sessionId = parseInt(params.sessionId as string, 10);
  const { currentQuestion, setQuestion, addAnswer, score, setTimeRemaining, reset } = useQuizStore();
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const { timeRemaining, start, stop, reset: resetTimer } = useTimer(
    currentQuestion?.timeLimit || null,
    () => {
      handleTimeout();
    }
  );

  useEffect(() => {
    loadQuestion();
  }, [sessionId]);

  useEffect(() => {
    if (currentQuestion && currentQuestion.timeLimit !== null) {
      setTimeRemaining(currentQuestion.timeLimit);
      resetTimer(currentQuestion.timeLimit);
      start();
      setStartTime(Date.now());
    }
  }, [currentQuestion]);

  const loadQuestion = async () => {
    try {
      const question = await quizApi.getCurrentQuestion(sessionId);
      setQuestion(question);
      setSelectedOptionId(null);
      setAnswerResult(null);
      if (question.timeLimit !== null) {
        setTimeRemaining(question.timeLimit);
        resetTimer(question.timeLimit);
        start();
        setStartTime(Date.now());
      }
    } catch (error) {
      console.error('Failed to load question:', error);
    }
  };

  const handleSelectOption = (optionId: number) => {
    if (isSubmitting || answerResult) return;
    setSelectedOptionId(optionId);
  };

  const handleSubmit = async () => {
    if (!selectedOptionId || !currentQuestion || isSubmitting) return;

    setIsSubmitting(true);
    stop();

    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    try {
      const result = await quizApi.submitAnswer(sessionId, {
        questionId: currentQuestion.questionId,
        selectedOptionId,
        timeTaken,
      });

      setAnswerResult(result);
      addAnswer(result);

      setTimeout(() => {
        if (currentQuestion.questionNumber >= currentQuestion.totalQuestions) {
          endGame();
        } else {
          loadQuestion();
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeout = async () => {
    if (!currentQuestion || isSubmitting || answerResult) return;

    setIsSubmitting(true);
    stop();

    try {
      const result = await quizApi.submitAnswer(sessionId, {
        questionId: currentQuestion.questionId,
        selectedOptionId: -1,
        timeTaken: currentQuestion.timeLimit || 30,
      });

      setAnswerResult(result);
      addAnswer(result);

      setTimeout(() => {
        if (currentQuestion.questionNumber >= currentQuestion.totalQuestions) {
          endGame();
        } else {
          loadQuestion();
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to handle timeout:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const endGame = async () => {
    try {
      const result = await quizApi.endGame(sessionId);
      reset();
      router.push(`/results?sessionId=${sessionId}`);
    } catch (error) {
      console.error('Failed to end game:', error);
    }
  };

  if (!currentQuestion) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Score: {score}</h2>
            </div>
            <QuizTimer
              timeRemaining={timeRemaining}
              totalTime={currentQuestion.timeLimit || 30}
            />
          </div>

          <QuestionCard
            question={currentQuestion}
            onSelectOption={handleSelectOption}
            selectedOptionId={selectedOptionId}
            disabled={isSubmitting || !!answerResult}
          />

          {answerResult && (
            <div className="mt-6 card p-4">
              <p className={`text-lg font-semibold ${answerResult.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {answerResult.isCorrect ? 'Correct!' : 'Incorrect'}
              </p>
              {answerResult.explanation && (
                <p className="mt-2 text-gray-600">{answerResult.explanation}</p>
              )}
              {!answerResult.isPractice && (
                <p className="mt-2 text-sm text-gray-500">
                  Points earned: {answerResult.pointsEarned}
                </p>
              )}
            </div>
          )}

          {selectedOptionId && !answerResult && (
            <div className="mt-6 text-center">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

