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
      localStorage.setItem('token', data.token);
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
      localStorage.setItem('token', data.token);
      setUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      });
    },
  });

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    queryClient.clear();
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