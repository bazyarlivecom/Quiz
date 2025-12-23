'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/store/slices/userSlice';
import { quizApi } from '@/services/api/quizApi';
import Link from 'next/link';

export default function QuizResultPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useUserStore();
  const matchId = parseInt(params.matchId as string);

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadResult();
  }, [matchId, user, router]);

  const loadResult = async () => {
    try {
      const data = await quizApi.getResult(matchId);
      setResult(data);
    } catch (error) {
      console.error('Failed to load result:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading results...</div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const accuracy = Math.round(result.accuracy);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
            Quiz Complete! 🎉
          </h1>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">{result.totalScore}</div>
              <div className="text-gray-600">Total Score</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">{accuracy}%</div>
              <div className="text-gray-600">Accuracy</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-600">{result.correctAnswers}</div>
              <div className="text-gray-600">Correct</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-red-600">{result.wrongAnswers}</div>
              <div className="text-gray-600">Wrong</div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <Link
              href="/dashboard"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Play Again
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



