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
import { ErrorMessage } from '../../../../components/common';
import { getErrorMessage } from '../../../../utils/errorHandler';

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
  const [error, setError] = useState<string | null>(null);

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
    if (currentQuestion && currentQuestion.timeLimit !== null && currentQuestion.timeLimit !== undefined) {
      setTimeRemaining(currentQuestion.timeLimit);
      resetTimer(currentQuestion.timeLimit);
      start();
      setStartTime(Date.now());
    }
  }, [currentQuestion, setTimeRemaining, resetTimer, start]);

  const loadQuestion = async () => {
    try {
      const question = await quizApi.getCurrentQuestion(sessionId);
      
      // If question is null, the game is finished
      if (!question || question === null) {
        await endGame();
        return;
      }
      
      // Validate question has required properties
      if (!question.questionId || !question.questionText || !question.options) {
        console.error('Invalid question data received:', question);
        await endGame();
        return;
      }
      
      setQuestion(question);
      setSelectedOptionId(null);
      setAnswerResult(null);
      
      // Only set timer if timeLimit is not null
      if (question.timeLimit !== null && question.timeLimit !== undefined) {
        setTimeRemaining(question.timeLimit);
        resetTimer(question.timeLimit);
        start();
        setStartTime(Date.now());
      }
    } catch (error) {
      console.error('Failed to load question:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      
      // If there's an error, try to end the game
      try {
        await endGame();
      } catch (endGameError) {
        console.error('Failed to end game:', endGameError);
        router.push('/dashboard');
      }
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

    // Calculate time taken, but cap it at timeLimit if available
    let timeTaken = Math.floor((Date.now() - startTime) / 1000);
    if (currentQuestion.timeLimit !== null && timeTaken > currentQuestion.timeLimit) {
      timeTaken = currentQuestion.timeLimit;
    }

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
      setError(getErrorMessage(error));
      // Reset to allow retry
      setIsSubmitting(false);
      setSelectedOptionId(null);
    }
  };

  const handleTimeout = async () => {
    if (!currentQuestion || isSubmitting || answerResult) return;

    setIsSubmitting(true);
    stop();

    try {
      // Use timeLimit as timeTaken for timeout, but cap at 120 seconds
      const timeTaken = currentQuestion.timeLimit 
        ? Math.min(currentQuestion.timeLimit, 120)
        : 30;
      
      const result = await quizApi.submitAnswer(sessionId, {
        questionId: currentQuestion.questionId,
        selectedOptionId: -1,
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
      console.error('Failed to handle timeout:', error);
      setError(getErrorMessage(error));
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
      // Even if ending fails, redirect to dashboard
      router.push('/dashboard');
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
          {error && (
            <ErrorMessage 
              message={error} 
              className="mb-4"
              onDismiss={() => setError(null)}
            />
          )}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Score: {score}</h2>
            </div>
            {currentQuestion && (
              <QuizTimer
                timeRemaining={timeRemaining}
                totalTime={currentQuestion.timeLimit || 30}
              />
            )}
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

