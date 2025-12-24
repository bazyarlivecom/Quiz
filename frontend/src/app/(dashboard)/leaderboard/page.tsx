'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '../../../components/layout/ProtectedRoute';
import { leaderboardApi, LeaderboardEntry } from '../../../services/api/leaderboardApi';
import { ErrorMessage } from '../../../components/common';
import { getErrorMessage } from '../../../utils/errorHandler';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<'global' | 'weekly'>('global');

  useEffect(() => {
    loadLeaderboard();
  }, [type]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = type === 'global'
        ? await leaderboardApi.getGlobal(100, 0)
        : await leaderboardApi.getWeekly(100);
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">جدول رده‌بندی</h1>

          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setType('global')}
              className={`btn ${type === 'global' ? 'btn-primary' : 'btn-secondary'}`}
            >
              رده‌بندی کلی
            </button>
            <button
              onClick={() => setType('weekly')}
              className={`btn ${type === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
            >
              رده‌بندی هفتگی
            </button>
          </div>

          {error && (
            <ErrorMessage 
              message={error} 
              className="mb-4"
              onDismiss={() => setError(null)}
            />
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : leaderboard.length === 0 && !error ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500">هیچ رکوردی یافت نشد.</p>
            </div>
          ) : (
            <div className="card overflow-hidden shadow-lg">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">رتبه</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">نام کاربری</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">سطح</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">امتیاز</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {leaderboard.map((entry, index) => (
                    <tr 
                      key={entry.userId} 
                      className={`hover:bg-blue-50 transition-colors ${
                        index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {index === 0 && <span className="text-2xl">🥇</span>}
                          {index === 1 && <span className="text-2xl">🥈</span>}
                          {index === 2 && <span className="text-2xl">🥉</span>}
                          <span className="text-sm font-bold text-gray-900">{entry.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{entry.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.level}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700">{entry.totalScore.toLocaleString('fa-IR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

