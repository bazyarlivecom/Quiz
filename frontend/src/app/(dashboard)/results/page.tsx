'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '../../../components/layout/ProtectedRoute';
import { quizApi } from '../../../services/api/quizApi';
import { GameResult } from '../../../types/quiz.types';

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = parseInt(searchParams.get('sessionId') || '0', 10);
  const [result, setResult] = useState<GameResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      loadResult();
    }
  }, [sessionId]);

  const loadResult = async () => {
    try {
      const data = await quizApi.endGame(sessionId);
      setResult(data);
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!result) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <p>No results found</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="card p-8 text-center">
            <h1 className="text-3xl font-bold mb-6">Quiz Results</h1>

            {!result.isPractice && (
              <div className="mb-6">
                <p className="text-5xl font-bold text-primary">{result.totalScore}</p>
                <p className="text-gray-600 mt-2">Total Score</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="card p-4">
                <p className="text-sm text-gray-500">Correct Answers</p>
                <p className="text-2xl font-bold text-green-600">{result.correctAnswers}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500">Wrong Answers</p>
                <p className="text-2xl font-bold text-red-600">{result.wrongAnswers}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-500">Accuracy</p>
              <p className="text-3xl font-bold">{result.accuracy.toFixed(1)}%</p>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-500">Time Spent</p>
              <p className="text-xl font-semibold">{Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s</p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="btn btn-primary"
              >
                Play Again
              </button>
              <button
                onClick={() => router.push('/leaderboard')}
                className="btn btn-secondary"
              >
                View Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

