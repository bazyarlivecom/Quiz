import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../storage/tokenStorage';

export const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

export const responseErrorInterceptor = async (error: AxiosError) => {
  if (error.response?.status === 401) {
    tokenStorage.clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
};

