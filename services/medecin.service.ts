import api from '@/lib/api';
import type { MedecinPublic } from '@/types/ui.types';

// ─── Liste publique des médecins ──────────────────────────────────────────────
export const fetchMedecinsPublic = async (): Promise<MedecinPublic[]> => {
  const { data } = await api.get('/users/doctors-public');
  return data;
};

// ─── Profil public d'un médecin ───────────────────────────────────────────────
export const fetchMedecinById = async (id: string): Promise<MedecinPublic> => {
  const { data } = await api.get(`/users/medecins/${id}`);
  return data;
};