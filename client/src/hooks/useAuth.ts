import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';
import { AxiosResponse } from 'axios';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const useAuth = () => {
  const queryClient = useQueryClient();
  const { user, setUser, loading } = useContext(AuthContext);

  const login = useMutation({
    mutationFn: (data: { email: string; password: string }) => apiClient.post('/auth/login', data).then((res: AxiosResponse) => res.data),
    onSuccess: (data) => {
      // Set user data in context
      setUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        // Add other user properties as needed
      });
    },
  });

  const register = useMutation({
    mutationFn: (data: any) => apiClient.post('/auth/register', data).then((res: AxiosResponse) => res.data),
    onSuccess: (data) => {
      setUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiClient.post('/auth/logout').then((res: AxiosResponse) => res.data),
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      localStorage.removeItem('user');
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    login: login.mutate,
    register: register.mutate,
    logout,
    user,
    loading: loading || login.isPending || register.isPending
  };
};

export default useAuth;