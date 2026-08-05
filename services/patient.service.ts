import api from '@/lib/api';
import type {
  PatientUser, Medecin, Appointment, PatientDoc, Notif,
} from '@/types/patient.types';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const login = async (email: string, password: string, role: string) => {
  const { data } = await api.post('/auth/login', { email, password, role });
  return data;
};

export const register = async (payload: {
  prenom: string; nom: string; email: string;
  password: string; role: string; dateNaissance: string;
  telephone?: string;
}) => {
  const { data } = await api.post('/auth/register', payload);
  return data;
};

// ─── Patient profile ──────────────────────────────────────────────────────────

export const fetchMe = async (): Promise<PatientUser> => {
  const { data } = await api.get('/patients/me');
  return data;
};

export const updateProfile = async (payload: Partial<PatientUser>) => {
  const { data } = await api.patch('/patients/profile', payload);
  return data;
};

export const updateMedicalRecord = async (_userId: string, payload: Record<string, unknown>) => {
  // Tout passe par /patients/profile — le backend sépare User vs Patient
  const { data } = await api.patch('/patients/profile', payload);
  return data;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  await api.patch('/patients/change-password', { currentPassword, newPassword });
};

// ─── Medecins ─────────────────────────────────────────────────────────────────

export const fetchMedecins = async (): Promise<Medecin[]> => {
  const { data } = await api.get('/doctors/list');
  return data;
};

export const fetchMedecinById = async (id: string): Promise<Medecin> => {
  const { data } = await api.get(`/doctors/profile/${id}`);
  return data;
};

export const fetchSpecialties = async (): Promise<string[]> => {
  const { data } = await api.get('/doctors/specialties');
  return data;
};

export const fetchMedecinSlots = async (medecinId: string): Promise<string[]> => {
  const { data } = await api.get(`/appointments/patient/medecin-slots/${medecinId}`);
  return data;
};

// ─── Appointments ─────────────────────────────────────────────────────────────

export const fetchMyAppointments = async (): Promise<Appointment[]> => {
  const { data } = await api.get('/appointments/patient/my-appointments');
  return data;
};

export const bookAppointment = async (payload: {
  medecinId: string; date: string; motif?: string | null;
}): Promise<Appointment> => {
  const { data } = await api.post('/appointments/patient/book', payload);
  return data;
};

export const cancelAppointment = async (id: string): Promise<void> => {
  await api.patch(`/appointments/patient/${id}/cancel`);
};

export const rescheduleAppointment = async (id: string, date: string): Promise<void> => {
  await api.patch(`/appointments/patient/${id}/reschedule`, { date });
};

// ─── Documents ────────────────────────────────────────────────────────────────

export const fetchMyDocuments = async (): Promise<PatientDoc[]> => {
  const { data } = await api.get('/documents/patient/my-docs');
  return data;
};

export const uploadDocument = async (formData: FormData): Promise<PatientDoc> => {
  const { data } = await api.post('/documents/patient/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteDocument = async (id: string): Promise<void> => {
  await api.delete(`/documents/patient/${id}`);
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const fetchNotifications = async (): Promise<Notif[]> => {
  const { data } = await api.get('/notifications');
  return data;
};

export const markNotifRead = async (id: string): Promise<void> => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllNotifsRead = async (): Promise<void> => {
  await api.patch('/notifications/read-all');
};

export const deleteNotif = async (id: string): Promise<void> => {
  await api.delete(`/notifications/${id}`);
};

export const deleteAllNotifs = async (): Promise<void> => {
  await api.delete('/notifications/all');
};