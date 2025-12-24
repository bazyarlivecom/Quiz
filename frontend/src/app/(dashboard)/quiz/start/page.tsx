'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '../../../../components/layout/ProtectedRoute';
import { useAuth } from '../../../../hooks/useAuth';
import { quizApi, StartGameRequest } from '../../../../services/api/quizApi';
import { useQuizStore } from '../../../../store/slices/quizSlice';

export default function StartQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { setSession } = useQuizStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startGame = async () => {
      if (!user) return;

      const mode = searchParams.get('mode') as 'SINGLE_PLAYER' | 'PRACTICE' | null;
      const categoryId = searchParams.get('category');

      if (!mode) {
        setError('Invalid game mode');
        setLoading(false);
        return;
      }

      try {
        const request: StartGameRequest = {
          gameMode: mode,
          questionsCount: 10,
          difficulty: 'MIXED',
        };

        if (categoryId) {
          request.categoryId = parseInt(categoryId, 10);
        }

        const result = await quizApi.startGame(request);
        setSession({
          id: result.sessionId,
          userId: user.id,
          categoryId: request.categoryId || null,
          difficulty: request.difficulty || 'MIXED',
          questionsCount: request.questionsCount || 10,
          status: 'ACTIVE',
          isPractice: mode === 'PRACTICE',
          gameMode: mode,
        });

        router.push(`/quiz/${result.sessionId}`);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to start game');
      } finally {
        setLoading(false);
      }
    };

    startGame();
  }, [user, searchParams, router, setSession]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={() => router.push('/dashboard')} className="btn btn-primary">
              Go Back
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return null;
}

