// hooks/useDossier.ts
import { useEffect, useState, useCallback } from 'react';
import { fetchMyAppointments, fetchMyDocuments } from '@/services/dossier.service';
import type { Appointment, PatientDocument, UserProfile } from '@/types/dossier.types';

interface DossierState {
  user:         UserProfile | null;
  appointments: Appointment[];
  documents:    PatientDocument[];
  loading:      boolean;
  error:        string | null;
}

export function useDossier() {
  const [state, setState] = useState<DossierState>({
    user: null, appointments: [], documents: [], loading: true, error: null,
  });

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const stored = localStorage.getItem('user');
      const user   = stored ? (JSON.parse(stored) as UserProfile) : null;

      const [appts, docs] = await Promise.allSettled([
        fetchMyAppointments(),
        fetchMyDocuments(),
      ]);

      setState({
        user,
        appointments: appts.status === 'fulfilled' ? appts.value : [],
        documents:    docs.status  === 'fulfilled' ? docs.value  : [],
        loading: false,
        error: null,
      });
    } catch {
      setState(s => ({
        ...s,
        loading: false,
        error: 'Impossible de charger vos données. Veuillez réessayer.',
      }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Ordonnances = appointments avec prescription
  const ordonnances = state.appointments
    .filter(a => a.consultation?.prescription)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { ...state, ordonnances, reload: load };
}