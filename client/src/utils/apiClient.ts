import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor for auth token
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config; // Direct return; async allows if needed for future
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError) => {
    console.error('API Error:', err.response?.data || err.message);
    return Promise.reject(err);
  }
);

export default apiClient;