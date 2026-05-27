import api from '@/lib/api';
import type { PatientAppointment } from '@/types/ui.types';

// ─── Récupère tous les RDV du patient connecté ────────────────────────────────
export const fetchMyAppointments = async (): Promise<PatientAppointment[]> => {
  const { data } = await api.get('/appointments/patient/my-appointments');
  return data;
};

// ─── Prendre un nouveau RDV ───────────────────────────────────────────────────
export const createAppointment = async (payload: {
  medecinId: string;
  date:      string;
  motif?:    string;
}): Promise<void> => {
  await api.post('/appointments/patient/book', payload);
};

// ─── Annuler un RDV ───────────────────────────────────────────────────────────
export const cancelAppointment = async (id: string): Promise<void> => {
  await api.patch(`/appointments/patient/${id}/cancel`);
};

// ─── Reprogrammer un RDV ──────────────────────────────────────────────────────
export const rescheduleAppointment = async (
  id:        string,
  creneauId: string,
  date:      string,
): Promise<void> => {
  await api.patch(`/appointments/patient/${id}/reschedule`, { creneauId, date });
};