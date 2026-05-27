'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/services/patient.service';

export function useLogin() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password, 'PATIENT');
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  return {
    email, setEmail, password, setPassword,
    loading, error, handleLogin,
    goRegister: () => router.push('/register'),
  };
}