'use client';

import ProtectedRoute from '../../../components/layout/ProtectedRoute';
import { useAuth } from '../../../hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Profile</h1>

          <div className="card p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Username</label>
                <p className="text-lg font-semibold">{user?.username}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="text-lg">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Level</label>
                <p className="text-lg font-semibold">{user?.level || 1}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">XP</label>
                <p className="text-lg font-semibold">{user?.xp || 0}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Total Score</label>
                <p className="text-lg font-semibold">{user?.totalScore || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

