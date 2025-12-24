'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/layout/ProtectedRoute';
import { useAuth } from '../../../hooks/useAuth';
import { questionApi } from '../../../services/api/questionApi';
import { Category } from '../../../services/api/questionApi';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await questionApi.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
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
              Welcome, {user?.username}!
            </h1>
            <div className="mt-4 flex gap-4">
              <div className="card p-4">
                <p className="text-sm text-gray-500">Level</p>
                <p className="text-2xl font-bold">{user?.level || 1}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500">XP</p>
                <p className="text-2xl font-bold">{user?.xp || 0}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500">Total Score</p>
                <p className="text-2xl font-bold">{user?.totalScore || 0}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <button
              onClick={() => handleStartGame('SINGLE_PLAYER')}
              className="card p-6 hover:shadow-lg transition-shadow text-left"
            >
              <h3 className="text-xl font-bold mb-2">Single Player</h3>
              <p className="text-gray-600">Play solo and improve your knowledge</p>
            </button>

            <button
              onClick={() => handleStartGame('PRACTICE')}
              className="card p-6 hover:shadow-lg transition-shadow text-left"
            >
              <h3 className="text-xl font-bold mb-2">Practice Mode</h3>
              <p className="text-gray-600">Learn without time pressure</p>
            </button>

            <button
              onClick={() => router.push('/leaderboard')}
              className="card p-6 hover:shadow-lg transition-shadow text-left"
            >
              <h3 className="text-xl font-bold mb-2">Leaderboard</h3>
              <p className="text-gray-600">See top players</p>
            </button>
          </div>

          {!loading && categories.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleStartGame('SINGLE_PLAYER', category.id)}
                    className="card p-4 hover:shadow-lg transition-shadow text-center"
                  >
                    <p className="font-semibold">{category.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

