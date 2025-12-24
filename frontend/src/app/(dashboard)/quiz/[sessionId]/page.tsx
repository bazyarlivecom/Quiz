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
      // Reset all state before loading new question
      setSelectedOptionId(null);
      setAnswerResult(null);
      setIsSubmitting(false);
      setError(null);
      
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
      setIsSubmitting(false);
      
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
      setIsSubmitting(false);
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setError(getErrorMessage(error));
      // Reset to allow retry
      setIsSubmitting(false);
      setSelectedOptionId(null);
      setAnswerResult(null);
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
      setIsSubmitting(false);
    } catch (error) {
      console.error('Failed to handle timeout:', error);
      setError(getErrorMessage(error));
      setIsSubmitting(false);
      setAnswerResult(null);
    }
  };

  const handleNextQuestion = () => {
    if (!currentQuestion) return;
    
    if (currentQuestion.questionNumber >= currentQuestion.totalQuestions) {
      endGame();
    } else {
      loadQuestion();
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
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-3 rounded-lg border-2 border-blue-200">
              <p className="text-sm text-gray-600 mb-1">امتیاز</p>
              <h2 className="text-2xl font-bold text-blue-700">{score.toLocaleString('fa-IR')}</h2>
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
            <div className={`mt-6 card p-6 border-2 ${
              answerResult.isCorrect 
                ? 'bg-green-50 border-green-300' 
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">
                  {answerResult.isCorrect ? '✅' : '❌'}
                </span>
                <p className={`text-xl font-bold ${
                  answerResult.isCorrect ? 'text-green-700' : 'text-red-700'
                }`}>
                  {answerResult.isCorrect ? 'پاسخ صحیح!' : 'پاسخ غلط'}
                </p>
              </div>
              {answerResult.explanation && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">توضیحات:</p>
                  <p className="text-gray-800">{answerResult.explanation}</p>
                </div>
              )}
              {!answerResult.isPractice && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-gray-600">امتیاز کسب شده:</span>
                  <span className="text-lg font-bold text-blue-700">
                    +{answerResult.pointsEarned}
                  </span>
                </div>
              )}
            </div>
          )}

          {selectedOptionId && !answerResult && (
            <div className="mt-6 text-center">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn btn-primary px-8 py-3 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    در حال ارسال...
                  </span>
                ) : (
                  'ثبت پاسخ'
                )}
              </button>
            </div>
          )}

          {answerResult && (
            <div className="mt-6 text-center">
              {currentQuestion && currentQuestion.questionNumber >= currentQuestion.totalQuestions ? (
                <button
                  onClick={handleNextQuestion}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center gap-2 mx-auto"
                >
                  <span>مشاهده نتایج</span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center gap-2 mx-auto"
                >
                  <span>سوال بعدی</span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

