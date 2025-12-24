'use client';

import ProtectedRoute from '../../../components/layout/ProtectedRoute';
import { useAuth } from '../../../hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">پروفایل کاربری</h1>

          <div className="card p-6 bg-white shadow-lg">
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-200">
                <label className="text-sm text-gray-500 block mb-2">نام کاربری</label>
                <p className="text-lg font-semibold text-gray-900">{user?.username}</p>
              </div>
              <div className="pb-4 border-b border-gray-200">
                <label className="text-sm text-gray-500 block mb-2">آدرس ایمیل</label>
                <p className="text-lg text-gray-900">{user?.email}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="text-sm text-gray-600 block mb-1">سطح</label>
                  <p className="text-2xl font-bold text-blue-700">{user?.level || 1}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <label className="text-sm text-gray-600 block mb-1">امتیاز تجربه</label>
                  <p className="text-2xl font-bold text-green-700">{user?.xp || 0}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <label className="text-sm text-gray-600 block mb-1">امتیاز کل</label>
                  <p className="text-2xl font-bold text-purple-700">{user?.totalScore || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

