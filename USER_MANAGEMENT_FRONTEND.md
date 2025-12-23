# Frontend Components - مدیریت کاربران

این فایل شامل کامپوننت‌های Frontend برای سیستم مدیریت کاربران است.

---

## 1. Authentication Components

### 1.1. Register Component

```typescript
// frontend/src/pages/RegisterPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api/authApi';
import { useAuthStore } from '../store/slices/userSlice';

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { setUser, setToken } = useAuthStore();
    
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            newErrors.username = 'Username can only contain letters, numbers, and underscores';
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!/[A-Z]/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one uppercase letter';
        }

        if (!/[a-z]/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one lowercase letter';
        }

        if (!/[0-9]/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one number';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validate()) {
            return;
        }

        setLoading(true);
        
        try {
            const result = await authApi.register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword
            });

            // Store user and token
            setUser(result.user);
            setToken(result.accessToken);
            
            // Store refresh token
            localStorage.setItem('refreshToken', result.refreshToken);

            // Redirect to home
            navigate('/');
        } catch (error: any) {
            setErrors({ 
                general: error.response?.data?.error || 'Registration failed' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <form onSubmit={handleSubmit} className="register-form">
                <h2>Create Account</h2>
                
                {errors.general && (
                    <div className="error-message">{errors.general}</div>
                )}

                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className={errors.username ? 'error' : ''}
                    />
                    {errors.username && (
                        <span className="field-error">{errors.username}</span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={errors.email ? 'error' : ''}
                    />
                    {errors.email && (
                        <span className="field-error">{errors.email}</span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={errors.password ? 'error' : ''}
                    />
                    {errors.password && (
                        <span className="field-error">{errors.password}</span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className={errors.confirmPassword ? 'error' : ''}
                    />
                    {errors.confirmPassword && (
                        <span className="field-error">{errors.confirmPassword}</span>
                    )}
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                </button>

                <p className="login-link">
                    Already have an account? <a href="/login">Login</a>
                </p>
            </form>
        </div>
    );
};
```

### 1.2. Login Component

```typescript
// frontend/src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api/authApi';
import { useAuthStore } from '../store/slices/userSlice';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { setUser, setToken } = useAuthStore();
    
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);
        
        try {
            const result = await authApi.login({
                email: formData.email,
                password: formData.password
            });

            // Store user and token
            setUser(result.user);
            setToken(result.accessToken);
            
            // Store refresh token
            localStorage.setItem('refreshToken', result.refreshToken);

            // Redirect to home
            navigate('/');
        } catch (error: any) {
            setErrors({ 
                general: error.response?.data?.error || 'Login failed' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <form onSubmit={handleSubmit} className="login-form">
                <h2>Login</h2>
                
                {errors.general && (
                    <div className="error-message">{errors.general}</div>
                )}

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>

                <p className="register-link">
                    Don't have an account? <a href="/register">Register</a>
                </p>
            </form>
        </div>
    );
};
```

---

## 2. User Profile Components

### 2.1. User Profile Page

```typescript
// frontend/src/pages/ProfilePage.tsx

import React, { useEffect, useState } from 'react';
import { userApi } from '../services/api/userApi';
import { useAuthStore } from '../store/slices/userSlice';
import { UserProfile } from '../components/user/UserProfile';
import { UserStats } from '../components/user/UserStats';
import { LevelProgress } from '../components/user/LevelProgress';

export const ProfilePage: React.FC = () => {
    const { user } = useAuthStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await userApi.getProfile();
            setProfile(data);
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!profile) {
        return <div>Profile not found</div>;
    }

    return (
        <div className="profile-page">
            <div className="profile-header">
                <UserProfile user={profile} />
            </div>
            
            <div className="profile-content">
                <div className="profile-section">
                    <LevelProgress 
                        level={profile.level}
                        xp={profile.xp}
                        xpForNextLevel={profile.xpForNextLevel}
                    />
                </div>
                
                <div className="profile-section">
                    <UserStats stats={profile.stats} />
                </div>
            </div>
        </div>
    );
};
```

### 2.2. Level Progress Component

```typescript
// frontend/src/components/user/LevelProgress.tsx

import React from 'react';

interface LevelProgressProps {
    level: number;
    xp: number;
    xpForNextLevel: number;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({
    level,
    xp,
    xpForNextLevel
}) => {
    const currentLevelXP = Math.pow(level - 1, 2) * 100;
    const xpInCurrentLevel = xp - currentLevelXP;
    const xpNeeded = xpForNextLevel - currentLevelXP;
    const progress = (xpInCurrentLevel / xpNeeded) * 100;

    return (
        <div className="level-progress">
            <div className="level-info">
                <h3>Level {level}</h3>
                <p className="xp-text">
                    {xpInCurrentLevel} / {xpNeeded} XP
                </p>
            </div>
            
            <div className="progress-bar">
                <div 
                    className="progress-fill"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
            </div>
            
            <p className="next-level">
                {xpNeeded - xpInCurrentLevel} XP until Level {level + 1}
            </p>
        </div>
    );
};
```

### 2.3. User Stats Component

```typescript
// frontend/src/components/user/UserStats.tsx

import React from 'react';

interface UserStatsProps {
    stats: {
        overall: {
            games_played: number;
            correct_answers: number;
            wrong_answers: number;
            best_score: number;
            accuracy_rate: number;
        } | null;
        byCategory: Array<{
            category_name: string;
            games_played: number;
            best_score: number;
            accuracy_rate: number;
        }>;
    };
}

export const UserStats: React.FC<UserStatsProps> = ({ stats }) => {
    const overall = stats.overall;

    return (
        <div className="user-stats">
            <h3>Statistics</h3>
            
            {overall && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Games Played</div>
                        <div className="stat-value">{overall.games_played}</div>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-label">Correct Answers</div>
                        <div className="stat-value">{overall.correct_answers}</div>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-label">Wrong Answers</div>
                        <div className="stat-value">{overall.wrong_answers}</div>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-label">Best Score</div>
                        <div className="stat-value">{overall.best_score}</div>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-label">Accuracy</div>
                        <div className="stat-value">
                            {overall.accuracy_rate.toFixed(1)}%
                        </div>
                    </div>
                </div>
            )}

            {stats.byCategory.length > 0 && (
                <div className="category-stats">
                    <h4>By Category</h4>
                    <div className="category-list">
                        {stats.byCategory.map((cat, index) => (
                            <div key={index} className="category-item">
                                <span className="category-name">{cat.category_name}</span>
                                <span className="category-games">
                                    {cat.games_played} games
                                </span>
                                <span className="category-accuracy">
                                    {cat.accuracy_rate.toFixed(1)}% accuracy
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
```

---

## 3. State Management

### 3.1. User Store (Zustand)

```typescript
// frontend/src/store/slices/userSlice.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: number;
    username: string;
    email: string;
    level: number;
    xp: number;
    totalScore: number;
    avatarUrl: string | null;
}

interface UserState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setUser: (user: User) => void;
    setToken: (token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<UserState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            setUser: (user) => set({ user, isAuthenticated: true }),
            setToken: (token) => set({ token }),
            logout: () => set({ 
                user: null, 
                token: null, 
                isAuthenticated: false 
            }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
```

---

## 4. API Services

### 4.1. Auth API

```typescript
// frontend/src/services/api/authApi.ts

import { apiClient } from './client';

export const authApi = {
    async register(data: {
        username: string;
        email: string;
        password: string;
        confirmPassword: string;
    }) {
        const response = await apiClient.post('/api/auth/register', data);
        return response.data.data;
    },

    async login(data: { email: string; password: string }) {
        const response = await apiClient.post('/api/auth/login', data);
        return response.data.data;
    },

    async refreshToken(refreshToken: string) {
        const response = await apiClient.post('/api/auth/refresh', {
            refreshToken
        });
        return response.data.data;
    }
};
```

### 4.2. User API

```typescript
// frontend/src/services/api/userApi.ts

import { apiClient } from './client';

export const userApi = {
    async getProfile() {
        const response = await apiClient.get('/api/users/me');
        return response.data.data;
    },

    async updateProfile(data: {
        username?: string;
        email?: string;
        avatarUrl?: string;
    }) {
        const response = await apiClient.put('/api/users/profile', data);
        return response.data.data;
    },

    async changePassword(data: {
        currentPassword: string;
        newPassword: string;
    }) {
        const response = await apiClient.post('/api/users/change-password', data);
        return response.data;
    },

    async getStatistics() {
        const response = await apiClient.get('/api/users/stats');
        return response.data.data;
    },

    async getGameHistory(limit: number = 10, offset: number = 0) {
        const response = await apiClient.get(
            `/api/users/history?limit=${limit}&offset=${offset}`
        );
        return response.data.data;
    }
};
```

### 4.3. API Client with Token

```typescript
// frontend/src/services/api/client.ts

import axios from 'axios';
import { authApi } from './authApi';

const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                const tokens = await authApi.refreshToken(refreshToken);
                
                localStorage.setItem('accessToken', tokens.accessToken);
                localStorage.setItem('refreshToken', tokens.refreshToken);

                originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh failed, logout user
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export { apiClient };
```

---

## 5. Protected Route Component

```typescript
// frontend/src/components/common/ProtectedRoute.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/slices/userSlice';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
```

---

این کامپوننت‌های Frontend برای سیستم مدیریت کاربران آماده استفاده هستند.

