'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/layout/ProtectedRoute';
import { useAuth } from '../../../hooks/useAuth';
import { questionApi } from '../../../services/api/questionApi';
import { Category } from '../../../services/api/questionApi';
import { ErrorMessage } from '../../../components/common';
import { getErrorMessage } from '../../../utils/errorHandler';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      setError(null);
      try {
        const data = await questionApi.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
        setError(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleStartGame = (gameMode: 'SINGLE_PLAYER' | 'PRACTICE', categoryId?: number) => {
    router.push(`/quiz/start?mode=${gameMode}${categoryId ? `&category=${categoryId}` : ''}`);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              خوش آمدید، {user?.username}!
            </h1>
            <p className="mt-2 text-gray-600">آماده چالش هستید؟ یک بازی جدید شروع کنید!</p>
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="card p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <p className="text-sm text-gray-600 mb-1">سطح</p>
                <p className="text-3xl font-bold text-blue-700">{user?.level || 1}</p>
              </div>
              <div className="card p-5 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <p className="text-sm text-gray-600 mb-1">امتیاز تجربه</p>
                <p className="text-3xl font-bold text-green-700">{user?.xp || 0}</p>
              </div>
              <div className="card p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <p className="text-sm text-gray-600 mb-1">امتیاز کل</p>
                <p className="text-3xl font-bold text-purple-700">{user?.totalScore || 0}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <button
              onClick={() => handleStartGame('SINGLE_PLAYER')}
              className="card p-6 hover:shadow-xl transition-all duration-300 text-right bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 hover:border-blue-400"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-blue-700">بازی تک نفره</h3>
                <span className="text-2xl">🎮</span>
              </div>
              <p className="text-gray-600 text-sm">به تنهایی بازی کنید و دانش خود را محک بزنید</p>
            </button>

            <button
              onClick={() => handleStartGame('PRACTICE')}
              className="card p-6 hover:shadow-xl transition-all duration-300 text-right bg-gradient-to-br from-green-50 to-white border-2 border-green-200 hover:border-green-400"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-green-700">حالت تمرین</h3>
                <span className="text-2xl">📚</span>
              </div>
              <p className="text-gray-600 text-sm">بدون محدودیت زمانی یاد بگیرید</p>
            </button>

            <button
              onClick={() => router.push('/leaderboard')}
              className="card p-6 hover:shadow-xl transition-all duration-300 text-right bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 hover:border-purple-400"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-purple-700">جدول رده‌بندی</h3>
                <span className="text-2xl">🏆</span>
              </div>
              <p className="text-gray-600 text-sm">برترین بازیکنان را ببینید</p>
            </button>
          </div>

          {error && (
            <ErrorMessage 
              message={error} 
              className="mb-4"
              onDismiss={() => setError(null)}
            />
          )}

          {!loading && categories.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">دسته‌بندی‌ها</h2>
              <p className="text-gray-600 mb-6">یک دسته‌بندی انتخاب کنید و بازی را شروع کنید</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleStartGame('SINGLE_PLAYER', category.id)}
                    className="card p-5 hover:shadow-xl transition-all duration-300 text-center bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300"
                  >
                    <p className="font-bold text-lg text-gray-800">{category.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && categories.length === 0 && !error && (
            <div className="card p-8 text-center">
              <p className="text-gray-500">هیچ دسته‌بندی‌ای در دسترس نیست.</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

