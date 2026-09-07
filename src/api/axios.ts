import axios from 'axios';
import { store } from '../store/store';
import { setToken, logout } from '../store/authSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const state = store.getState();
      const refreshToken = state.auth.refreshToken;

      if (refreshToken) {
        try {
          const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/refresh`, {
            token: refreshToken
          });
          
          const newAccessToken = res.data.accessToken;
          // Update store with new access token
          store.dispatch(setToken({ token: newAccessToken }));
          
          // Retry original request with new token
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token failed (e.g. expired or invalid)
          store.dispatch(logout());
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        store.dispatch(logout());
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
