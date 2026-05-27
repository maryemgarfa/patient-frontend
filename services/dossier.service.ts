// services/dossier.service.ts
import api from '@/lib/api';
import type { Appointment, PatientDocument, DocumentVisibility } from '@/types/dossier.types';

// ─── Appointments ─────────────────────────────────────────────────────────────
export const fetchMyAppointments = async (): Promise<Appointment[]> => {
  const { data } = await api.get<Appointment[]>('/appointments/patient/my-appointments');
  return data;
};

// ─── Documents ────────────────────────────────────────────────────────────────
export const fetchMyDocuments = async (): Promise<PatientDocument[]> => {
  const { data } = await api.get<PatientDocument[]>('/documents/patient/my-docs');
  return data;
};

export const uploadDocument = async (
  file:        File,
  category:    string,
  titre?:      string,
  visibility?: DocumentVisibility,   // NOUVEAU
): Promise<PatientDocument> => {
  const form = new FormData();
  form.append('fichier',    file);
  form.append('type',       category);
  form.append('titre',      titre ?? file.name);
  form.append('visibility', visibility ?? 'PRIVE'); // défaut : privé

  const { data } = await api.post<PatientDocument>('/documents/patient/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteDocument = async (id: string): Promise<void> => {
  await api.delete(`/documents/patient/${id}`);
};