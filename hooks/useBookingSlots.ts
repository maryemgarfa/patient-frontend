// hooks/useBookingSlots.ts
//
// Hook centralisé pour charger et enrichir les créneaux d'un médecin.
//
// RÈGLE MÉTIER CORRIGÉE :
//   Un créneau est "réservé" (bloqué) uniquement si le rendez-vous associé
//   est en statut CONFIRME.
//   Les rendez-vous EN_ATTENTE ne bloquent PAS le créneau pour les autres patients.
//
// Ce hook effectue systématiquement deux appels en parallèle :
//   1. GET /users/medecins/:id     → creneaux bruts + absences + disponibilites
//   2. GET /appointments/medecin-slots/:id → créneaux dont le RDV est CONFIRME
//      (ISO tronqué à la minute, ex: "2025-06-10T09:00")
//
// Il croise les deux sources et retourne un tableau Creneau[] dont
// chaque entrée a estReserve = true seulement si confirmé.

import { useState, useEffect } from 'react';
import api from '@/lib/api';

// ─── Types exportés ───────────────────────────────────────────────────────────

export interface Creneau {
  id: string;
  debut: string;
  fin: string;
  estReserve: boolean;
}

export interface Absence {
  id: string;
  debut: string;
  fin: string;
  raison?: string;
}

export interface Disponibilite {
  id: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
}

export interface MedecinProfile {
  id: string;
  specialite: string;
  tarif_consultation?: number;
  duree_consultation?: number;
  adresseCabinet?: string;
  creneaux: Creneau[];
  absences: Absence[];
  disponibilites: Disponibilite[];
  user: {
    nom: string;
    prenom: string;
    ville?: string;
    photoProfil?: string;
    photoCouverture?: string;
  };
}

export interface BookingSlotsResult {
  profile:      MedecinProfile | null;
  creneaux:     Creneau[];       // créneaux enrichis (estReserve = CONFIRME seulement)
  absences:     Absence[];
  disponibilites: Disponibilite[];
  loading:      boolean;
  error:        string | null;
  reload:       () => void;
}

// ─── Helpers (réexportés pour que les composants puissent les utiliser) ───────

export function toLocalDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  return (
    d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export function buildDateKey(year: number, month: number, day: number): string {
  return year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}

export function isSlotInAbsence(debut: string, fin: string, absences: Absence[]): boolean {
  const sD = new Date(debut).getTime();
  const sF = new Date(fin).getTime();
  return absences.some(a => {
    const aD = new Date(a.debut).getTime();
    const aF = new Date(a.fin).getTime();
    return sD < aF && sF > aD;
  });
}

export function isDayFullyAbsent(dateKey: string, absences: Absence[]): boolean {
  const dayS = new Date(dateKey + 'T00:00:00').getTime();
  const dayE = new Date(dateKey + 'T23:59:59').getTime();
  return absences.some(
    a => new Date(a.debut).getTime() <= dayS && new Date(a.fin).getTime() >= dayE
  );
}

export function isDayPartiallyAbsent(dateKey: string, absences: Absence[]): boolean {
  const dayS = new Date(dateKey + 'T00:00:00').getTime();
  const dayE = new Date(dateKey + 'T23:59:59').getTime();
  return absences.some(a => {
    const aD = new Date(a.debut).getTime();
    const aF = new Date(a.fin).getTime();
    return aD < dayE && aF > dayS;
  });
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useBookingSlots(medecinId: string | null): BookingSlotsResult {
  const [profile,        setProfile]        = useState<MedecinProfile | null>(null);
  const [creneaux,       setCreneaux]       = useState<Creneau[]>([]);
  const [absences,       setAbsences]       = useState<Absence[]>([]);
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [tick,           setTick]           = useState(0); // pour forcer le reload

  useEffect(() => {
    if (!medecinId) return;

    setLoading(true);
    setError(null);

    Promise.all([
      api.get(`/doctors/profile/${medecinId}`),
      // Cet endpoint doit retourner uniquement les débuts de créneaux
      // dont le RDV associé est en statut CONFIRME (tableau de strings ISO).
      // Exemple de réponse : ["2025-06-10T09:00", "2025-06-11T14:30"]
      api.get(`/appointments/patient/medecin-slots/${medecinId}`),
    ])
      .then(([profileRes, slotsRes]) => {
        const data = profileRes.data as MedecinProfile;

        // ── DIAGNOSTIC (à retirer en prod) ──────────────────────────────────
        if (process.env.NODE_ENV === 'development') {
          console.log('[useBookingSlots] profile reçu:', data?.id, data?.user?.nom);
          console.log('[useBookingSlots] creneaux bruts:', data?.creneaux?.length ?? '⚠️ undefined/null');
          console.log('[useBookingSlots] absences:', data?.absences?.length ?? 0);
          console.log('[useBookingSlots] disponibilites:', data?.disponibilites?.length ?? 0);
          console.log('[useBookingSlots] takenSlots (CONFIRME):', slotsRes.data);
        }
        // ────────────────────────────────────────────────────────────────────
        // ── RÈGLE MÉTIER CORRIGÉE ───────────────────────────────────────────
        // takenSlots = créneaux dont le RDV est CONFIRME (pas EN_ATTENTE).
        // Si le backend filtre déjà par statut CONFIRME, parfait.
        // Sinon, on accepte le tableau tel quel — c'est le backend qui décide.
        // La correction principale est dans le backend (voir note ci-dessous).
        const takenSlots: string[]    = slotsRes.data ?? [];

        // Normalise un string de date en "YYYY-MM-DDTHH:MM" en heure LOCALE
        // (sans conversion UTC). Gère les formats ISO avec ou sans timezone :
        //   "2025-06-10T09:00:00+01:00"  →  "2025-06-10T09:00"
        //   "2025-06-10T09:00:00.000Z"   →  heure locale (ex: +01:00 → "2025-06-10T10:00")
        //   "2025-06-10T09:00"            →  "2025-06-10T09:00"
        function toLocalISO(dateStr: string): string {
          const d = new Date(dateStr);
          return (
            d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0') + 'T' +
            String(d.getHours()).padStart(2, '0') + ':' +
            String(d.getMinutes()).padStart(2, '0')
          );
        }

        // Normalise aussi takenSlots pour que la comparaison soit cohérente
        // (le backend peut envoyer "2025-06-10T09:00" ou "2025-06-10T09:00:00+01:00")
        const takenSet = new Set(takenSlots.map(s => toLocalISO(s)));

        const enriched: Creneau[] = (data.creneaux || []).map(c => ({
          ...c,
          // On ne se fie PAS à c.estReserve (qui peut être true pour EN_ATTENTE).
          // On recalcule à partir de takenSlots (CONFIRME uniquement).
          estReserve: takenSet.has(toLocalISO(c.debut)),
        }));

        setProfile(data);
        setCreneaux(enriched);
        setAbsences(data.absences || []);
        setDisponibilites(data.disponibilites || []);
      })
      .catch(err => {
        console.error('[useBookingSlots] erreur:', err);
        setError('Impossible de charger les disponibilités.');
        setCreneaux([]);
        setAbsences([]);
        setDisponibilites([]);
      })
      .finally(() => setLoading(false));
  }, [medecinId, tick]);

  return {
    profile,
    creneaux,
    absences,
    disponibilites,
    loading,
    error,
    reload: () => setTick(t => t + 1),
  };
}