import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 (not 403, not other errors)
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Queue requests while refreshing
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refresh_token = localStorage.getItem('refresh_token');

      // No refresh token available — bail out without redirect loop
      if (!refresh_token || refresh_token === 'undefined' || refresh_token === 'null') {
        processQueue(error, null);
        return Promise.reject(error);
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        { refresh_token },
        { withCredentials: true },
      );

      const { access_token, refresh_token: new_refresh_token } = response.data.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', new_refresh_token);

      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
      processQueue(null, access_token);

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      // Use store logout instead of hard redirect to avoid loops
      const { useAuthStore } = await import('@/stores/authStore');
      useAuthStore.getState().setUser(null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
