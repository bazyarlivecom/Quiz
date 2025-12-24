'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xl font-bold text-primary"
            >
              Quiz Game
            </button>
          </div>

          <nav className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-700 hover:text-primary"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/leaderboard')}
              className="text-gray-700 hover:text-primary"
            >
              Leaderboard
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="text-gray-700 hover:text-primary"
            >
              Profile
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{user?.username}</span>
              <span className="text-sm text-gray-400">Lv.{user?.level || 1}</span>
            </div>
            <button
              onClick={logout}
              className="btn btn-secondary text-sm"
            >
              Logout
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

