import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor (not needed for manually adding Bearer token anymore as we use cookies)
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  return config;
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