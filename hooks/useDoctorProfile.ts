import { useEffect, useState } from 'react';
import { fetchMedecinProfile } from '@/services/Doctorprofileservice';
import type { MedecinProfile, TabKey } from '@/types/profilMed.types';

export function useDoctorProfile(id: string | string[] | undefined) {
  const [medecin,     setMedecin]     = useState<MedecinProfile | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState<TabKey>('apropos');
  const [toast,       setToast]       = useState('');
  const [toastType,   setToastType]   = useState<'success' | 'error'>('success');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false); // ← simple boolean, BookingStepper charge lui-même ses créneaux

  useEffect(() => {
    if (!id) return;
    fetchMedecinProfile(String(id))
      .then(setMedecin)
      .finally(() => setLoading(false));
  }, [id]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3500);
  };

  return {
    medecin,
    loading,
    activeTab,   setActiveTab,
    toast,       toastType,
    lightboxUrl, setLightboxUrl,
    showBooking, setShowBooking,
    showToast,
  };
}