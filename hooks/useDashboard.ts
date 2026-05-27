'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchMedecins, fetchMyAppointments, fetchSpecialties,
  fetchMedecinById, fetchMedecinSlots, bookAppointment,
} from '@/services/patient.service';
import type { Medecin, Appointment } from '@/types/patient.types';

// bookingMed contient maintenant aussi existingRdv pour garantir
// qu'ils arrivent dans le même setState — évite le problème de timing async.
type BookingState = {
  medecin: any;
  existingRdv: Appointment | null;
} | null;

export function useDashboard() {
  const router = useRouter();

  // ── Data ────────────────────────────────────────────────────────────────────
  const [user,          setUser]          = useState<any>(null);
  const [medecins,      setMedecins]      = useState<Medecin[]>([]);
  const [appointments,  setAppointments]  = useState<Appointment[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [dynamicSpecs,  setDynamicSpecs]  = useState<string[]>([]);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [searchMed,     setSearchMed]     = useState('');
  const [selectedSpec,  setSelectedSpec]  = useState('');
  const [selectedVille, setSelectedVille] = useState('');
  const [showFilters,   setShowFilters]   = useState(false);

  // ── Booking ─────────────────────────────────────────────────────────────────
  // bookingState regroupe medecin + existingRdv dans un seul setState atomique.
  // Cela évite le bug de timing où existingRdv=null quand BookingStepper monte.
  const [bookingState,   setBookingState]   = useState<BookingState>(null);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);

  // Compatibilité avec le reste du code
  const bookingMed    = bookingState?.medecin    ?? null;
  const existingRdv   = bookingState?.existingRdv ?? null;

  const setBookingMed = (med: any) =>
    setBookingState(prev => med ? { medecin: med, existingRdv: prev?.existingRdv ?? null } : null);

  const setExistingRdv = (rdv: Appointment | null) =>
    setBookingState(prev => prev ? { ...prev, existingRdv: rdv } : null);

  // ── Toast ───────────────────────────────────────────────────────────────────
  const [toast,     setToast]     = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 3500);
  }, []);

  // ── Load all data ────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    const [meds, appts, specs] = await Promise.all([
      fetchMedecins(),
      fetchMyAppointments(),
      fetchSpecialties(),
    ]);
    setMedecins(meds);
    setAppointments(appts);
    setDynamicSpecs(specs);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) try { setUser(JSON.parse(stored)); } catch {}
    load().catch(console.error).finally(() => setLoading(false));
  }, []);

  // ── Open booking stepper ─────────────────────────────────────────────────────
  const openBooking = async (m: Medecin, rdv?: Appointment) => {
    setBookingLoading(m.id);
    try {
      const fullMedecin = await fetchMedecinById(m.id);
      const takenSlots: string[] = await fetchMedecinSlots(m.id);

      const creneauxWithStatus = ((fullMedecin as any).creneaux || []).map((c: any) => ({
        ...c,
        estReserve: c.estReserve || takenSlots.includes(
          new Date(c.debut).toISOString().slice(0, 16)
        ),
      }));

      // Un seul setState atomique : medecin + existingRdv ensemble
      setBookingState({
        medecin: {
          ...fullMedecin,
          creneaux: creneauxWithStatus,
          absences: (fullMedecin as any).absences || [],
        },
        existingRdv: rdv ?? null,
      });
    } catch {
      showToast('Impossible de charger les disponibilités du médecin.', 'error');
    } finally {
      setBookingLoading(null);
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const specialites = Array.from(new Set(medecins.map(m => m.specialite))).sort();
  const villes = Array.from(
    new Set(medecins.map(m => m.user.ville?.trim()).filter(Boolean))
  ).sort() as string[];

  const filteredMedecins = medecins.filter(m => {
    const s = searchMed.toLowerCase().trim();
    const matchSearch = !s || `${m.user.nom} ${m.user.prenom} ${m.specialite} ${m.user.ville || ''}`.toLowerCase().includes(s);
    const matchSpec   = !selectedSpec   || m.specialite === selectedSpec;
    const matchVille  = !selectedVille  || m.user.ville?.toLowerCase().trim() === selectedVille.toLowerCase().trim();
    return matchSearch && matchSpec && matchVille;
  });

  const prochainRdv = appointments
    .filter(a => new Date(a.date) >= new Date() && a.statut !== 'ANNULE')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  return {
    // Data
    user, medecins, appointments, loading,
    dynamicSpecs, specialites, villes,
    filteredMedecins, prochainRdv,
    // Filters
    searchMed, setSearchMed,
    selectedSpec, setSelectedSpec,
    selectedVille, setSelectedVille,
    showFilters, setShowFilters,
    // Booking
    bookingMed, setBookingMed,
    existingRdv, setExistingRdv,
    bookingLoading, openBooking,
    // Toast
    toast, toastType, showToast,
    // Actions
    load, router,
  };
}