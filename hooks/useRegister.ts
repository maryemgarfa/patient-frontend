'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register, login } from '@/services/patient.service';

type RegisterForm = {
  prenom: string; nom: string; email: string;
  password: string; confirm: string; dateNaissance: string;
};

export function useRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form,    setForm]    = useState<RegisterForm>({
    prenom: '', nom: '', email: '', password: '', confirm: '', dateNaissance: '',
  });

  const set = (k: keyof RegisterForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.prenom || !form.nom || !form.email || !form.password) {
      return setError('Tous les champs sont obligatoires');
    }
    if (form.password !== form.confirm) return setError('Les mots de passe ne correspondent pas');
    if (form.password.length < 8)       return setError('Mot de passe : minimum 8 caractères');
    if (!form.dateNaissance)            return setError('Date de naissance obligatoire');

    setLoading(true);
    try {
      await register({ prenom: form.prenom, nom: form.nom, email: form.email, password: form.password, role: 'PATIENT', dateNaissance: form.dateNaissance });
      const data = await login(form.email, form.password, 'PATIENT');
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('showProfileCompletion', 'true');
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return { form, set, loading, error, handleSubmit };
}