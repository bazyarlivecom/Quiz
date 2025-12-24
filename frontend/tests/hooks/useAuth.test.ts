import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../src/hooks/useAuth';

// Mock the API
jest.mock('../../src/services/api/authApi', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    getMe: jest.fn(),
  },
}));

// Mock token storage
jest.mock('../../src/services/storage/tokenStorage', () => ({
  tokenStorage: {
    getToken: jest.fn(),
    setToken: jest.fn(),
    clearToken: jest.fn(),
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with no user', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should login successfully', async () => {
    const { authApi } = require('../../src/services/api/authApi');
    const { tokenStorage } = require('../../src/services/storage/tokenStorage');

    authApi.login.mockResolvedValue({
      user: { id: 1, username: 'test', email: 'test@example.com' },
      token: 'token',
      refreshToken: 'refresh',
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(tokenStorage.setToken).toHaveBeenCalledWith('token');
    expect(result.current.isAuthenticated).toBe(true);
  });
});

