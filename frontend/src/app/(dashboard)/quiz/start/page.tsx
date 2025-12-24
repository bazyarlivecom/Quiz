'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '../../../../components/layout/ProtectedRoute';
import { useAuth } from '../../../../hooks/useAuth';
import { quizApi, StartGameRequest } from '../../../../services/api/quizApi';
import { useQuizStore } from '../../../../store/slices/quizSlice';
import { ErrorMessage } from '../../../../components/common';
import { extractError, getErrorMessage } from '../../../../utils/errorHandler';

export default function StartQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { setSession } = useQuizStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [abandoning, setAbandoning] = useState(false);

  const handleAbandonGame = async () => {
    if (!activeSessionId) return;
    
    setAbandoning(true);
    try {
      await quizApi.abandonGame(activeSessionId);
      // Retry starting the game
      const mode = searchParams.get('mode') as 'SINGLE_PLAYER' | 'PRACTICE' | null;
      const categoryId = searchParams.get('category');
      
      if (!mode) {
        setError('Invalid game mode');
        setLoading(false);
        return;
      }

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
        userId: user!.id,
        categoryId: request.categoryId || null,
        difficulty: request.difficulty || 'MIXED',
        questionsCount: request.questionsCount || 10,
        status: 'ACTIVE',
        isPractice: mode === 'PRACTICE',
        gameMode: mode,
      });

      router.push(`/quiz/${result.sessionId}`);
    } catch (err: any) {
      setError(getErrorMessage(err));
      setAbandoning(false);
    }
  };

  const handleResumeGame = () => {
    if (activeSessionId) {
      router.push(`/quiz/${activeSessionId}`);
    }
  };

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
        const { message, data } = extractError(err);
        
        // Check if error contains activeSessionId
        if (message.includes('already has an active game')) {
          const errors = data?.errors || [];
          const activeSessionError = errors.find((e: any) => e.field === 'activeSessionId' || e.activeSessionId);
          if (activeSessionError?.message || activeSessionError?.activeSessionId) {
            setActiveSessionId(parseInt(activeSessionError.message || activeSessionError.activeSessionId, 10));
          } else {
            // Try to get active game
            try {
              const activeGame = await quizApi.getActiveGame();
              if (activeGame) {
                setActiveSessionId(activeGame.sessionId);
              }
            } catch {
              // Ignore error
            }
          }
        }
        
        setError(message);
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
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center max-w-md w-full">
            {error.includes('already has an active game') && activeSessionId ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Active Game Found</h3>
                <p className="text-yellow-700 mb-4">{error}</p>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleResumeGame}
                    className="btn btn-primary"
                    disabled={abandoning}
                  >
                    Resume Game
                  </button>
                  <button
                    onClick={handleAbandonGame}
                    className="btn btn-secondary"
                    disabled={abandoning}
                  >
                    {abandoning ? 'Abandoning...' : 'Abandon & Start New Game'}
                  </button>
                </div>
              </div>
            ) : (
              <ErrorMessage 
                message={error} 
                className="mb-4"
                onDismiss={() => setError(null)}
              />
            )}
            
            <button
              onClick={() => router.push('/dashboard')}
              className="btn btn-outline"
              disabled={abandoning}
            >
              Go Back to Dashboard
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return null;
}

