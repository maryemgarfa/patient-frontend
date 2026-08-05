'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/services/patient.service';
import api from '@/lib/api';

type RegisterForm = {
  prenom: string; nom: string; email: string;
  password: string; confirm: string; dateNaissance: string;
  telephone: string;
};

export type RegisterStep = 'form' | 'phone' | 'otp';

export function useRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [step,    setStep]    = useState<RegisterStep>('form');
  const [userId,  setUserId]  = useState('');
  const [form,    setForm]    = useState<RegisterForm>({
    prenom: '', nom: '', email: '', password: '', confirm: '',
    dateNaissance: '', telephone: '',
  });

  const set = (k: keyof RegisterForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Étape 1 — valide le formulaire et passe à l'étape téléphone
  const handleSubmit = async () => {
    setError('');
    if (!form.prenom || !form.nom || !form.email || !form.password) {
      return setError('Tous les champs sont obligatoires');
    }
    if (form.password !== form.confirm) return setError('Les mots de passe ne correspondent pas');
    if (form.password.length < 8)       return setError('Mot de passe : minimum 8 caractères');
    if (!form.dateNaissance)            return setError('Date de naissance obligatoire');

    setStep('phone'); // ← pas d'appel API ici, juste navigation
  };

  // Étape 2 — envoie OTP avec toutes les données
  const handleSendOtp = async () => {
    setError('');
    if (!form.telephone || form.telephone.replace(/\D/g, '').length < 8) {
      return setError('Numéro WhatsApp tunisien (8 chiffres) obligatoire');
    }

    setLoading(true);
    try {
      await api.post('/otp/send-register', {
        phone: form.telephone,
        registrationData: {
          prenom:        form.prenom,
          nom:           form.nom,
          email:         form.email,
          password:      form.password,
          role:          'PATIENT',
          dateNaissance: form.dateNaissance,
        },
      });
      setStep('otp');
    } catch (e: any) {
      setError(e.response?.data?.message || "Erreur lors de l'envoi du code");
    } finally {
      setLoading(false);
    }
  };

  // Appelé après vérification OTP réussie
  const handleOtpSuccess = async (newUserId?: string) => {
    try {
      const data = await login(form.email, form.password, 'PATIENT');
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('showProfileCompletion', 'true');
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur de connexion');
    }
  };

  const goBack = () => {
    if (step === 'otp')   setStep('phone');
    if (step === 'phone') setStep('form');
  };

  return { form, set, loading, error, step, userId, handleSubmit, handleSendOtp, handleOtpSuccess, goBack };
}