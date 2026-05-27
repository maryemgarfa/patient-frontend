import api from '@/lib/api';
import type { PatientDocument } from '@/types/ui.types';

// ─── Récupère tous les documents du patient connecté ─────────────────────────
export const fetchMyDocuments = async (): Promise<PatientDocument[]> => {
  const { data } = await api.get('/documents/my-documents');
  return data;
};