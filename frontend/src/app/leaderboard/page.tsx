'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/slices/userSlice';
import apiClient from '@/services/api/client';
import Link from 'next/link';

interface LeaderboardEntry {
  id: number;
  username: string;
  level: number;
  xp: number;
  total_score: number;
  rank: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadLeaderboard();
  }, [user, router]);

  const loadLeaderboard = async () => {
    try {
      const [leaderboardRes, rankRes] = await Promise.all([
        apiClient.get('/leaderboard/global?limit=100'),
        apiClient.get('/leaderboard/my-rank'),
      ]);

      setLeaderboard(leaderboardRes.data.data);
      setMyRank(rankRes.data.data.rank);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Leaderboard</h1>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {myRank && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
            <p className="text-lg font-semibold text-center">
              Your Rank: <span className="text-yellow-600">#{myRank}</span>
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">XP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard.map((entry) => (
                <tr
                  key={entry.id}
                  className={entry.id === user?.id ? 'bg-blue-50' : ''}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    #{entry.rank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {entry.username}
                    {entry.id === user?.id && ' (You)'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.level}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.xp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                    {entry.total_score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



