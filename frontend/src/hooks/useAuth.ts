import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../store/slices/userSlice';
import { authApi } from '../services/api/authApi';
import { tokenStorage } from '../services/storage/tokenStorage';

export const useAuth = () => {
  const router = useRouter();
  const { user, setUser, clearUser, isAuthenticated } = useUserStore();

  useEffect(() => {
    const initAuth = async () => {
      const token = tokenStorage.getToken();
      if (token && !user) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);
        } catch (error) {
          clearUser();
          tokenStorage.clearToken();
        }
      }
    };

    initAuth();
  }, [user, setUser, clearUser]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      tokenStorage.setToken(response.token);
      tokenStorage.setRefreshToken(response.refreshToken);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await authApi.register({ username, email, password });
      tokenStorage.setToken(response.token);
      tokenStorage.setRefreshToken(response.refreshToken);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    clearUser();
    tokenStorage.clearToken();
    router.push('/login');
  };

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
  };
};

