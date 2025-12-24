'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '../../../components/layout/ProtectedRoute';
import { leaderboardApi, LeaderboardEntry } from '../../../services/api/leaderboardApi';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<'global' | 'weekly'>('global');

  useEffect(() => {
    loadLeaderboard();
  }, [type]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = type === 'global'
        ? await leaderboardApi.getGlobal(100, 0)
        : await leaderboardApi.getWeekly(100);
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>

          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setType('global')}
              className={`btn ${type === 'global' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Global
            </button>
            <button
              onClick={() => setType('weekly')}
              className={`btn ${type === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Weekly
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaderboard.map((entry) => (
                    <tr key={entry.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{entry.rank}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.level}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{entry.totalScore}</td>
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

