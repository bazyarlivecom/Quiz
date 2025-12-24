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
        questionsCount: 3,
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
        questionsCount: request.questionsCount || 3,
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
          questionsCount: request.questionsCount || 3,
          status: 'ACTIVE',
          isPractice: mode === 'PRACTICE',
          gameMode: mode,
        });

        router.push(`/quiz/${result.sessionId}`);
      } catch (err: any) {
        const { message, data } = extractError(err);
        
        // Check if error contains activeSessionId
        if (message.includes('already has an active game')) {
          // Try to extract activeSessionId from error data
          let sessionId: number | null = null;
          
          // Check if activeSessionId is in errors array
          if (data?.errors && Array.isArray(data.errors)) {
            const activeSessionError = data.errors.find((e: any) => 
              e.activeSessionId || e.field === 'activeSessionId'
            );
            if (activeSessionError?.activeSessionId) {
              sessionId = parseInt(activeSessionError.activeSessionId, 10);
            }
          }
          
          // If not found in errors, try to get active game from API
          if (!sessionId) {
            try {
              const activeGame = await quizApi.getActiveGame();
              if (activeGame) {
                sessionId = activeGame.sessionId;
              }
            } catch {
              // Ignore error
            }
          }
          
          if (sessionId) {
            setActiveSessionId(sessionId);
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
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-4 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">⚠️</span>
                  <h3 className="text-lg font-bold text-yellow-800">بازی فعال یافت شد</h3>
                </div>
                <p className="text-yellow-700 mb-4 text-right">
                  شما یک بازی فعال دارید. می‌خواهید آن را ادامه دهید یا بازی جدیدی شروع کنید؟
                </p>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleResumeGame}
                    className="btn btn-primary w-full"
                    disabled={abandoning}
                  >
                    ادامه بازی قبلی
                  </button>
                  <button
                    onClick={handleAbandonGame}
                    className="btn btn-secondary w-full"
                    disabled={abandoning}
                  >
                    {abandoning ? 'در حال رها کردن...' : 'رها کردن و شروع بازی جدید'}
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
              className="btn btn-outline w-full"
              disabled={abandoning}
            >
              بازگشت به داشبورد
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return null;
}

