'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/slices/userSlice';
import { questionApi, Category } from '@/services/api/questionApi';
import { quizApi } from '@/services/api/quizApi';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useUserStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | 'MIXED'>('MIXED');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadCategories();
  }, [user, router]);

  const loadCategories = async () => {
    try {
      const data = await questionApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleStartQuiz = async (gameMode: 'SINGLE_PLAYER' | 'PRACTICE' = 'SINGLE_PLAYER') => {
    setLoading(true);
    try {
      const result = await quizApi.startQuiz({
        categoryId: selectedCategory,
        difficulty,
        questionsCount: 10,
        gameMode,
      });
      router.push(`/quiz/${result.matchId}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.username}!</h1>
              <p className="text-gray-600 mt-2">
                Level {user.level} • {user.xp} XP • Score: {user.totalScore}
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Start Quiz</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MIXED">Mixed</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleStartQuiz('SINGLE_PLAYER')}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Starting...' : 'Start Quiz'}
              </button>
              <button
                onClick={() => handleStartQuiz('PRACTICE')}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? 'Starting...' : 'Practice Mode'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Quick Links</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/leaderboard"
              className="p-4 bg-purple-100 rounded-lg hover:bg-purple-200 transition text-center font-semibold"
            >
              Leaderboard
            </Link>
            <Link
              href="/profile"
              className="p-4 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition text-center font-semibold"
            >
              Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



