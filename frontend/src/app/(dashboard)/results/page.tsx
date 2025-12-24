'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '../../../components/layout/ProtectedRoute';
import { quizApi } from '../../../services/api/quizApi';
import { GameResult } from '../../../types/quiz.types';
import { ErrorMessage } from '../../../components/common';
import { getErrorMessage } from '../../../utils/errorHandler';

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = parseInt(searchParams.get('sessionId') || '0', 10);
  const [result, setResult] = useState<GameResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadResult();
    }
  }, [sessionId]);

  const loadResult = async () => {
    try {
      const data = await quizApi.endGame(sessionId);
      setResult(data);
      setError(null);
    } catch (error) {
      console.error('Failed to load results:', error);
      setError(getErrorMessage(error));
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

  if (!result && !error) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">نتیجه‌ای یافت نشد</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (error && !result) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="max-w-md w-full">
            <ErrorMessage 
              message={error} 
              className="mb-4"
            />
            <button
              onClick={() => router.push('/dashboard')}
              className="btn btn-primary w-full"
            >
              بازگشت به داشبورد
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="card p-8 text-center bg-gradient-to-br from-white to-blue-50 shadow-xl">
            <div className="mb-6">
              <span className="text-6xl">🎉</span>
            </div>
            <h1 className="text-3xl font-bold mb-6 text-gray-900">نتایج بازی</h1>

            {!result.isPractice && (
              <div className="mb-8 bg-gradient-to-br from-blue-100 to-purple-100 p-6 rounded-lg border-2 border-blue-300">
                <p className="text-6xl font-bold text-blue-700 mb-2">{result.totalScore.toLocaleString('fa-IR')}</p>
                <p className="text-gray-700 text-lg font-semibold">امتیاز کل</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="card p-5 bg-green-50 border-2 border-green-200">
                <p className="text-sm text-gray-600 mb-2">پاسخ‌های صحیح</p>
                <p className="text-3xl font-bold text-green-700">{result.correctAnswers}</p>
              </div>
              <div className="card p-5 bg-red-50 border-2 border-red-200">
                <p className="text-sm text-gray-600 mb-2">پاسخ‌های غلط</p>
                <p className="text-3xl font-bold text-red-700">{result.wrongAnswers}</p>
              </div>
            </div>

            <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-600 mb-2">دقت پاسخ‌ها</p>
              <p className="text-4xl font-bold text-purple-700">{result.accuracy.toFixed(1)}%</p>
            </div>

            <div className="mb-8 bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">زمان صرف شده</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.floor(result.timeSpent / 60)} دقیقه و {result.timeSpent % 60} ثانیه
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="btn btn-primary px-8"
              >
                بازی مجدد
              </button>
              <button
                onClick={() => router.push('/leaderboard')}
                className="btn btn-secondary px-8"
              >
                مشاهده جدول رده‌بندی
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

