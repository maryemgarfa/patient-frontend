import api from '@/lib/api';
import type { MedecinProfile, BookingMedecin } from '@/types/profilMed.types';
import type { Creneau } from '@/hooks/useBookingSlots';

export async function fetchMedecinProfile(id: string): Promise<MedecinProfile | null> {
  try {
    const res = await api.get(`/users/medecins/${id}`);
    return res.data;
  } catch {
    // Fallback : cherche dans la liste complète
    try {
      const res = await api.get('/doctors/list');
      return res.data.find((m: MedecinProfile) => m.id === id) ?? null;
    } catch {
      return null;
    }
  }
}

export async function fetchBookingData(medecinId: string): Promise<BookingMedecin> {
  const [profileRes, slotsRes] = await Promise.all([
    api.get(`/users/medecins/${medecinId}`),
    api.get(`/appointments/medecin-slots/${medecinId}`),
  ]);

  const data = profileRes.data;
  const takenSlots: string[] = slotsRes.data ?? [];

  const creneaux: Creneau[] = (data.creneaux ?? []).map((c: Creneau) => ({
    ...c,
    estReserve: takenSlots.includes(new Date(c.debut).toISOString().slice(0, 16)),
  }));

  return {
    id:                 data.id,
    specialite:         data.specialite,
    tarif_consultation: data.tarif_consultation,
    duree_consultation: data.duree_consultation,
    adresseCabinet:     data.adresseCabinet,
    creneaux,
    absences:           data.absences       ?? [],
    disponibilites:     data.disponibilites  ?? [],
    user:               data.user,
  };
}