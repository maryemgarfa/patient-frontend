'use client';
// components/BookingStepper.tsx

import { useState, useEffect } from 'react';
import {
  X, ChevronRight, Clock, Check, RefreshCw,
  Calendar, MapPin, Stethoscope, AlertCircle, CalendarClock,
} from 'lucide-react';
import api from '@/lib/api';
import { useBookingSlots } from '@/hooks/useBookingSlots';
import { MedecinCalendar } from '@/components/rdv/MedecinCalendar';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Creneau {
  id: string; debut: string; fin: string; estReserve: boolean;
}
export interface Disponibilite {
  id: string; jour: string; heureDebut: string; heureFin: string;
}
export interface Absence {
  id: string; debut: string; fin: string; raison?: string;
}
export interface Medecin {
  id: string; specialite: string;
  tarif_consultation?: number; duree_consultation?: number;
  adresseCabinet?: string;
  creneaux: Creneau[];
  disponibilites?: Disponibilite[];
  absences?: Absence[];
  user: { nom: string; prenom: string; ville?: string; photoProfil?: string };
}
export interface Appointment {
  id: string; date: string; statut: string; motif?: string;
  medecin: { id: string; user: { nom: string; prenom: string } };
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const SPEC_GRADIENT: Record<string, string> = {
  CARDIOLOGIE: 'from-red-400 to-rose-500', NEUROLOGIE: 'from-purple-400 to-violet-600',
  OPHTALMOLOGIE: 'from-blue-400 to-sky-500', MEDECINE_GENERALE: 'from-emerald-400 to-teal-500',
  PEDIATRIE: 'from-pink-400 to-rose-400', ORTHOPEDIE: 'from-amber-400 to-orange-500',
  DERMATOLOGIE: 'from-orange-400 to-amber-500', GYNECOLOGIE: 'from-rose-400 to-pink-500',
  DENTISTE: 'from-cyan-400 to-blue-400', PSYCHIATRE: 'from-indigo-400 to-purple-500',
  NUTRITIONNISTE: 'from-lime-400 to-green-500', default: 'from-slate-400 to-slate-600',
};

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function fmtDay(key: string) {
  return new Date(key + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function BookingStepper({ medecin, existingRdv, appointments = [], onClose, onBooked }: {
  medecin: Medecin; existingRdv?: Appointment | null; appointments?: Appointment[];
  onClose: () => void; onBooked: () => void;
}) {
  const gradient = SPEC_GRADIENT[medecin.specialite] ?? SPEC_GRADIENT.default;

  const {
    creneaux: rawCreneaux, absences, disponibilites, loading: slotsLoading, error: slotsError,
  } = useBookingSlots(medecin.id);

  // En mode modification, débloquer le créneau du RDV existant pour qu'il soit sélectionnable
  const creneaux = rawCreneaux.map(c => {
    if (!existingRdv) return c;
    const isSameSlot =
      new Date(c.debut).toISOString().slice(0, 16) ===
      new Date(existingRdv.date).toISOString().slice(0, 16);
    return isSameSlot ? { ...c, estReserve: false } : c;
  });
  console.log('[BookingStepper] existingRdv reçu:', existingRdv);

  // ── État local ─────────────────────────────────────────────────────────────
  const [step,         setStep]         = useState(1);
  const [selCreneauId, setSelCreneauId] = useState('');
  const [motif,        setMotif]        = useState(existingRdv?.motif ?? '');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  // Pré-sélectionner le créneau du RDV existant une fois les créneaux chargés
  useEffect(() => {
    if (existingRdv && creneaux.length > 0 && !selCreneauId) {
      const match = creneaux.find(
        c => new Date(c.debut).toISOString().slice(0, 16) ===
             new Date(existingRdv.date).toISOString().slice(0, 16)
      );
      if (match) setSelCreneauId(match.id);
    }
  }, [existingRdv, creneaux]);

  const selCreneau = creneaux.find(c => c.id === selCreneauId);

  const handleBook = async () => {
    if (!selCreneau) return;
    setLoading(true); setError('');
    try {
      if (existingRdv) {
        // Route correcte : /reschedule  avec creneauId + date
        await api.patch(`/appointments/patient/${existingRdv.id}/reschedule`, {
          creneauId: selCreneau.id,
          date: selCreneau.debut,
          motif: motif || null,
        });
      } else {
        await api.post('/appointments/patient/book', {
          medecinId: medecin.id, date: selCreneau.debut, motif: motif || null,
        });
      }
      onBooked();
    } catch (e: any) {
      const body = e.response?.data;
      setError(
        body?.code === 'SLOT_TAKEN'
          ? "Ce créneau vient d'être confirmé par un autre patient."
          : body?.message || 'Erreur lors de la réservation.'
      );
      setLoading(false);
    }
  };

  const selDateKey = selCreneau
    ? new Date(selCreneau.debut).getFullYear() + '-' +
      String(new Date(selCreneau.debut).getMonth() + 1).padStart(2, '0') + '-' +
      String(new Date(selCreneau.debut).getDate()).padStart(2, '0')
    : '';

  const STEPS = [{ n: 1, label: 'Date & heure' }, { n: 2, label: 'Motif' }, { n: 3, label: 'Confirmer' }];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[96vh] animate-in zoom-in-95 duration-200">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-8 pt-7 pb-0 shrink-0">
          <div className={`bg-gradient-to-r ${gradient} rounded-[1.5rem] p-5 flex items-center gap-4 mb-6`}>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-lg shrink-0">
              {medecin.user.prenom[0]}{medecin.user.nom[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-base">Dr. {medecin.user.prenom} {medecin.user.nom}</p>
              <p className="text-white/70 text-[11px] font-bold mt-0.5">{medecin.specialite.replace(/_/g, ' ')}</p>
            </div>
            {medecin.tarif_consultation && (
              <div className="bg-white/20 rounded-xl px-3 py-2 shrink-0">
                <p className="text-white font-black text-sm">{String(medecin.tarif_consultation)} TND</p>
                <p className="text-white/60 text-[9px] font-bold">consultation</p>
              </div>
            )}
            <button onClick={onClose} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all shrink-0">
              <X size={16}/>
            </button>
          </div>

          {/* Steps */}
          <div className="flex items-center px-1 pb-2">
            {existingRdv && (
              <div className="w-full mb-4 text-center">
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                  <CalendarClock size={11} /> Modification de rendez-vous
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center px-1 pb-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center flex-1">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step > s.n ? 'bg-emerald-500 text-white' :
                    step === s.n ? 'bg-slate-900 text-white ring-4 ring-slate-900/10' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {step > s.n ? <Check size={13}/> : s.n}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider hidden sm:block ${step === s.n ? 'text-slate-900' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 rounded-full transition-all ${step > s.n ? 'bg-emerald-500' : 'bg-slate-100'}`}/>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-8 pb-2">

          {/* Bandeau mode modification */}
          {existingRdv && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <CalendarClock size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-black text-amber-800 uppercase tracking-wide mb-0.5">
                  Mode modification
                </p>
                <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                  Votre rendez-vous du{' '}
                  <span className="font-black">
                    {new Date(existingRdv.date).toLocaleDateString('fr-FR', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}
                    {' à '}
                    {new Date(existingRdv.date).toLocaleTimeString('fr-FR', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  {' '}sera remplacé par le nouveau créneau sélectionné.
                </p>
              </div>
            </div>
          )}

          {slotsError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2">
              <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5"/>
              <p className="text-[11px] font-bold text-red-700">{slotsError}</p>
            </div>
          )}

          {step === 1 && (
            <MedecinCalendar
              creneaux={creneaux}
              absences={absences}
              disponibilites={disponibilites}
              selCreneauId={selCreneauId}
              onSelectCreneau={setSelCreneauId}
              gradient={gradient}
              loading={slotsLoading}
            />
          )}

          {step === 2 && (
            <div className="max-w-md mx-auto space-y-5 py-2">
              {selCreneau && (
                <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-4 flex items-center gap-4 text-white`}>
                  <Calendar size={18} className="text-white/70 shrink-0"/>
                  <div>
                    <p className="text-[10px] font-black text-white/60 uppercase">Rendez-vous sélectionné</p>
                    <p className="text-sm font-black mt-0.5">{fmtDay(selDateKey)} à {fmtTime(selCreneau.debut)}</p>
                  </div>
                </div>
              )}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Motif de consultation <span className="text-slate-300">(optionnel)</span>
                </label>
                <textarea value={motif} onChange={e => setMotif(e.target.value)}
                  placeholder="Expliquez brièvement la raison de votre visite..." rows={5}
                  className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm font-bold outline-none focus:border-emerald-300 resize-none transition-all placeholder:text-slate-300"/>
              </div>
            </div>
          )}

          {step === 3 && selCreneau && (
            <div className="max-w-md mx-auto space-y-4 py-2">
              <div className="bg-slate-900 rounded-[2rem] p-7 text-white">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black`}>
                    {medecin.user.prenom[0]}{medecin.user.nom[0]}
                  </div>
                  <div>
                    <p className="font-black text-white">Dr. {medecin.user.prenom} {medecin.user.nom}</p>
                    <p className="text-white/50 text-[10px] font-bold mt-0.5">{medecin.specialite.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Calendar size={16} className="text-emerald-400 shrink-0"/>
                    <div>
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Date</p>
                      <p className="text-sm font-black text-white mt-0.5 capitalize">{fmtDay(selDateKey)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Clock size={16} className="text-emerald-400 shrink-0"/>
                    <div>
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Heure</p>
                      <p className="text-sm font-black text-white mt-0.5">{fmtTime(selCreneau.debut)}</p>
                    </div>
                  </div>
                  {medecin.adresseCabinet && (
                    <div className="flex items-center gap-4">
                      <MapPin size={16} className="text-emerald-400 shrink-0"/>
                      <div>
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Cabinet</p>
                        <p className="text-sm font-black text-white mt-0.5">{medecin.adresseCabinet}</p>
                      </div>
                    </div>
                  )}
                  {motif && (
                    <div className="flex items-start gap-4">
                      <Stethoscope size={16} className="text-emerald-400 shrink-0 mt-0.5"/>
                      <div>
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Motif</p>
                        <p className="text-sm font-bold text-white/80 mt-0.5">{motif}</p>
                      </div>
                    </div>
                  )}
                  {medecin.tarif_consultation && (
                    <div className="mt-2 pt-4 border-t border-white/10 flex items-center justify-between">
                      <p className="text-xs font-black text-white/50">Tarif consultation</p>
                      <p className="text-xl font-black text-white">{String(medecin.tarif_consultation)} TND</p>
                    </div>
                  )}
                </div>
              </div>
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <p className="text-xs font-black text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="px-8 py-6 border-t border-slate-100 flex gap-3 shrink-0">
          <button onClick={() => step === 1 ? onClose() : setStep(s => s - 1)}
            className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all">
            {step === 1 ? 'Annuler' : '← Retour'}
          </button>
          <button
            disabled={step === 1 ? !selCreneauId : loading}
            onClick={() => step < 3 ? setStep(s => s + 1) : handleBook()}
            className={`flex-[2] py-3.5 bg-gradient-to-r ${gradient} text-white rounded-2xl text-sm font-black shadow-lg disabled:opacity-40 flex items-center justify-center gap-2 transition-all hover:opacity-90`}>
            {loading
              ? <><RefreshCw className="animate-spin" size={16}/> Réservation...</>
              : step === 3
              ? <><Check size={16}/> {existingRdv ? 'Modifier le rendez-vous' : 'Confirmer le rendez-vous'}</>
              : <>Suivant <ChevronRight size={16}/></>}
          </button>
        </div>
      </div>
    </div>
  );
}