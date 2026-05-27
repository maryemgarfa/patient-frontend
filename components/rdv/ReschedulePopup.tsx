'use client';
// components/ReschedulePopup.tsx
//
// Popup de modification de rendez-vous (EN_ATTENTE uniquement).
// Affiche un grand calendrier interactif + créneaux horaires du jour sélectionné.
// Architecture séparée pour lisibilité et maintenance.

import { useState, useMemo, useCallback } from 'react';
import {
  X, Calendar, Clock, ChevronLeft, ChevronRight,
  AlertCircle, RefreshCw, Check, Trash2, MapPin,
  Stethoscope, Ban, Lock,
} from 'lucide-react';
import api from '@/lib/api';
import { useBookingSlots } from '@/hooks/useBookingSlots';
import type { Creneau, Absence } from '@/hooks/useBookingSlots';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatutKey = 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'TERMINE';

export interface AppointmentForReschedule {
  id: string;
  date: string;
  motif?: string;
  statut: StatutKey;
  medecin: {
    id: string;
    specialite: string;
    adresseCabinet?: string;
    tarif_consultation?: number;
    user: { nom: string; prenom: string };
  };
}

interface Props {
  appointment: AppointmentForReschedule;
  onClose: () => void;
  onRescheduled: () => void;
  onCancelled: () => void;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const SPEC_GRADIENT: Record<string, string> = {
  CARDIOLOGIE:      'from-red-400 to-rose-500',
  NEUROLOGIE:       'from-purple-400 to-violet-600',
  OPHTALMOLOGIE:    'from-blue-400 to-sky-500',
  MEDECINE_GENERALE:'from-emerald-400 to-teal-500',
  PEDIATRIE:        'from-pink-400 to-rose-400',
  ORTHOPEDIE:       'from-amber-400 to-orange-500',
  DERMATOLOGIE:     'from-orange-400 to-amber-500',
  GYNECOLOGIE:      'from-rose-400 to-pink-500',
  DENTISTE:         'from-cyan-400 to-blue-400',
  PSYCHIATRE:       'from-indigo-400 to-purple-500',
  NUTRITIONNISTE:   'from-lime-400 to-green-500',
  default:          'from-slate-400 to-slate-600',
};

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function fmtDayLong(key: string) {
  return new Date(key + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}
function toLocalKey(dateStr: string): string {
  const d = new Date(dateStr);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function buildKey(y: number, m: number, d: number): string {
  return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}
function isSlotInAbsence(debut: string, fin: string, absences: Absence[]): boolean {
  const sD = new Date(debut).getTime(), sF = new Date(fin).getTime();
  return absences.some(a => {
    const aD = new Date(a.debut).getTime(), aF = new Date(a.fin).getTime();
    return sD < aF && sF > aD;
  });
}
function isDayFullyAbsent(dateKey: string, absences: Absence[]): boolean {
  const dayS = new Date(dateKey + 'T00:00:00').getTime();
  const dayE = new Date(dateKey + 'T23:59:59').getTime();
  return absences.some(a => new Date(a.debut).getTime() <= dayS && new Date(a.fin).getTime() >= dayE);
}
function isDayPartialAbsent(dateKey: string, absences: Absence[]): boolean {
  const dayS = new Date(dateKey + 'T00:00:00').getTime();
  const dayE = new Date(dateKey + 'T23:59:59').getTime();
  return absences.some(a => {
    const aD = new Date(a.debut).getTime(), aF = new Date(a.fin).getTime();
    return aD < dayE && aF > dayS;
  });
}

// ─── Sous-composant : Calendrier ──────────────────────────────────────────────

function RescheduleCalendar({
  creneaux, absences, selDateKey, selCreneauId,
  onSelectDate, onSelectCreneau, gradient,
}: {
  creneaux: Creneau[];
  absences: Absence[];
  selDateKey: string;
  selCreneauId: string;
  onSelectDate: (key: string) => void;
  onSelectCreneau: (id: string) => void;
  gradient: string;
}) {
  const now = new Date();
  const [calM, setCalM] = useState(() => {
    const first = creneaux
      .filter(c => !c.estReserve && new Date(c.debut) > now)
      .sort((a, b) => new Date(a.debut).getTime() - new Date(b.debut).getTime())[0];
    return first ? new Date(first.debut).getMonth() : now.getMonth();
  });
  const [calY, setCalY] = useState(() => {
    const first = creneaux
      .filter(c => !c.estReserve && new Date(c.debut) > now)
      .sort((a, b) => new Date(a.debut).getTime() - new Date(b.debut).getTime())[0];
    return first ? new Date(first.debut).getFullYear() : now.getFullYear();
  });

  const daysInMonth    = new Date(calY, calM + 1, 0).getDate();
  const firstDayOfWeek = (new Date(calY, calM, 1).getDay() + 6) % 7;
  const canGoBack      = !(calM === now.getMonth() && calY === now.getFullYear());

  const prevMonth = () => {
    if (!canGoBack) return;
    calM === 0 ? (setCalM(11), setCalY(y => y - 1)) : setCalM(m => m - 1);
  };
  const nextMonth = () => {
    calM === 11 ? (setCalM(0), setCalY(y => y + 1)) : setCalM(m => m + 1);
  };

  const creneauxByDate = useMemo(() => {
    const map: Record<string, Creneau[]> = {};
    creneaux.forEach(c => {
      const key = toLocalKey(c.debut);
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [creneaux]);

  const daysWithFree = useMemo(() => {
    const s = new Set<string>();
    Object.entries(creneauxByDate).forEach(([key, crns]) => {
      if (crns.some(c => !c.estReserve && !isSlotInAbsence(c.debut, c.fin, absences) && new Date(c.debut) > now)) {
        s.add(key);
      }
    });
    return s;
  }, [creneauxByDate, absences]);

  const daysWithAnyCreneau = useMemo(() => new Set(Object.keys(creneauxByDate)), [creneauxByDate]);

  // Créneaux du jour sélectionné
  const creneauxForDay = useMemo(() => {
    if (!selDateKey) return [];
    return (creneauxByDate[selDateKey] || [])
      .sort((a, b) => new Date(a.debut).getTime() - new Date(b.debut).getTime());
  }, [selDateKey, creneauxByDate]);

  const amCreneaux = creneauxForDay.filter(c => new Date(c.debut).getHours() < 13);
  const pmCreneaux = creneauxForDay.filter(c => new Date(c.debut).getHours() >= 13);

  const renderCreneau = (c: Creneau) => {
    const isAbsent  = isSlotInAbsence(c.debut, c.fin, absences);
    const isPast    = new Date(c.debut) <= now;
    const isBlocked = c.estReserve || isAbsent || isPast;
    const isSel     = selCreneauId === c.id;
    const hStr      = fmtTime(c.debut);

    return (
      <button
        key={c.id}
        disabled={isBlocked}
        onClick={() => !isBlocked && onSelectCreneau(c.id)}
        title={c.estReserve ? 'Déjà réservé' : isAbsent ? 'Médecin absent' : isPast ? 'Heure passée' : undefined}
        className={`relative py-2.5 px-2 rounded-xl text-xs font-black border-2 transition-all flex items-center justify-center gap-1 ${
          isSel
            ? `bg-gradient-to-br ${gradient} text-white border-transparent shadow-md scale-105`
            : isBlocked
            ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
            : 'bg-white text-slate-600 border-slate-100 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
        }`}
      >
        {!isSel && isAbsent      && <Ban  size={9} className="text-orange-300 shrink-0"/>}
        {!isSel && c.estReserve  && !isAbsent && <Lock size={9} className="text-slate-300 shrink-0"/>}
        {!isSel && isPast        && !c.estReserve && !isAbsent && <Clock size={9} className="text-slate-200 shrink-0"/>}
        <span className={isBlocked && !isSel ? 'line-through opacity-50' : ''}>{hStr}</span>
      </button>
    );
  };

  const libresCount = creneauxForDay.filter(
    c => !c.estReserve && !isSlotInAbsence(c.debut, c.fin, absences) && new Date(c.debut) > now
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* ── Calendrier mensuel ─────────────────────────────────────────── */}
      <div>
        {/* Navigateur de mois */}
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-black text-slate-800 capitalize">
            {new Date(calY, calM).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h4>
          <div className="flex gap-1.5">
            <button onClick={prevMonth} disabled={!canGoBack}
              className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 disabled:opacity-20 hover:bg-slate-200 transition-all">
              <ChevronLeft size={14}/>
            </button>
            <button onClick={nextMonth}
              className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all">
              <ChevronRight size={14}/>
            </button>
          </div>
        </div>

        {/* En-têtes jours */}
        <div className="grid grid-cols-7 mb-1.5">
          {JOURS.map((j, i) => (
            <div key={i} className="text-center text-[9px] font-black text-slate-300 uppercase py-1">{j}</div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`}/>)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day      = i + 1;
            const dKey     = buildKey(calY, calM, day);
            const past     = new Date(calY, calM, day, 23, 59, 59) < now;
            const hasFree  = daysWithFree.has(dKey);
            const hasCrn   = daysWithAnyCreneau.has(dKey);
            const fullAbs  = !past && isDayFullyAbsent(dKey, absences);
            const partAbs  = !past && !fullAbs && isDayPartialAbsent(dKey, absences);
            const isActive = selDateKey === dKey;
            const isToday  = day === now.getDate() && calM === now.getMonth() && calY === now.getFullYear();
            const clickable = !past && !fullAbs && hasCrn;

            return (
              <button key={day}
                disabled={!clickable}
                onClick={() => clickable && onSelectDate(dKey)}
                title={fullAbs ? 'Médecin absent' : partAbs ? 'Absence partielle' : undefined}
                className={`relative h-10 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${
                  isActive  ? `bg-gradient-to-br ${gradient} text-white shadow-lg scale-105`
                : fullAbs   ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                : isToday && hasFree  ? 'bg-slate-900 text-white'
                : isToday && hasCrn   ? 'bg-slate-700 text-slate-300'
                : isToday             ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : past      ? 'text-slate-200 cursor-not-allowed'
                : hasFree   ? 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-black'
                : hasCrn    ? 'bg-slate-50 text-slate-300 cursor-pointer'
                            : 'text-slate-200 cursor-not-allowed'
                }`}>
                {fullAbs ? (
                  <span className="relative">
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="w-4 h-px bg-slate-300 rotate-45 absolute"/>
                    </span>
                    {day}
                  </span>
                ) : day}
                {!past && !isActive && !fullAbs && hasFree &&
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full"/>}
                {!past && !isActive && !fullAbs && hasCrn && !hasFree &&
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-slate-300 rounded-full"/>}
                {partAbs && !isActive &&
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-400 rounded-full"/>}
              </button>
            );
          })}
        </div>

        {/* Légende */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-4 pt-4 border-t border-slate-100">
          {[
            ['bg-emerald-400', 'Disponible'],
            ['bg-slate-300',   'Complet'],
            ['bg-orange-400',  'Abs. partielle'],
            ['bg-slate-100 border border-slate-200', 'Absent / Fermé'],
          ].map(([cls, lbl]) => (
            <span key={lbl} className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase">
              <span className={`w-2 h-2 rounded-full shrink-0 ${cls}`}/>{lbl}
            </span>
          ))}
        </div>
      </div>

      {/* ── Créneaux du jour sélectionné ───────────────────────────────── */}
      <div className="flex flex-col">
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
          {selDateKey
            ? <>{libresCount} libre{libresCount > 1 ? 's' : ''} · <span className="capitalize">{fmtDayLong(selDateKey)}</span></>
            : 'Créneaux horaires'}
        </p>

        {!selDateKey ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 min-h-[180px]">
            <Calendar size={28} className="text-slate-200 mb-2"/>
            <p className="text-xs font-bold text-slate-300">Sélectionnez une date</p>
          </div>
        ) : creneauxForDay.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 min-h-[180px]">
            <Ban size={24} className="text-slate-200 mb-2"/>
            <p className="text-xs font-bold text-slate-300">Aucun créneau ce jour</p>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto flex-1">
            {amCreneaux.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span className="w-3 h-px bg-slate-200 inline-block"/>Matin<span className="flex-1 h-px bg-slate-100 inline-block"/>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {amCreneaux.map(renderCreneau)}
                </div>
              </div>
            )}
            {pmCreneaux.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span className="w-3 h-px bg-slate-200 inline-block"/>Après-midi<span className="flex-1 h-px bg-slate-100 inline-block"/>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {pmCreneaux.map(renderCreneau)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ReschedulePopup({ appointment, onClose, onRescheduled, onCancelled }: Props) {
  const now      = new Date();
  const gradient = SPEC_GRADIENT[appointment.medecin.specialite] ?? SPEC_GRADIENT.default;

  const {
    creneaux, absences, loading: slotsLoading, error: slotsError,
  } = useBookingSlots(appointment.medecin.id);

  const [selDateKey,   setSelDateKey]   = useState('');
  const [selCreneauId, setSelCreneauId] = useState('');

  const [rescheduling, setRescheduling] = useState(false);
  const [cancelling,   setCancelling]   = useState(false);
  const [error,        setError]        = useState('');
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  const selCreneau = creneaux.find(c => c.id === selCreneauId);

  // Réinitialise le créneau quand on change de date
  const handleSelectDate = useCallback((key: string) => {
    setSelDateKey(key);
    setSelCreneauId('');
    setError('');
  }, []);

  const handleSelectCreneau = useCallback((id: string) => {
    setSelCreneauId(id);
    setError('');
  }, []);

  const handleReschedule = async () => {
    if (!selCreneau) return;
    setRescheduling(true); setError('');
    try {
      await api.patch(`/appointments/${appointment.id}/reschedule`, {
        date: selCreneau.debut,
      });
      onRescheduled();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Ce créneau n\'est plus disponible.');
      setRescheduling(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.patch(`/appointments/${appointment.id}/cancel`);
      onCancelled();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors de l\'annulation.');
      setCancelling(false);
      setShowConfirmCancel(false);
    }
  };

  // La date actuelle du RDV pour l'affichage dans le récap
  const rdvDateKey = toLocalKey(appointment.date);
  const isEditable = new Date(appointment.date) > now && appointment.statut === 'EN_ATTENTE';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[96vh] animate-in zoom-in-95 duration-200">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-7 pt-6 pb-5 shrink-0 border-b border-slate-100">
          <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-4 flex items-center gap-4`}>
            {/* Avatar */}
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-base shrink-0">
              {appointment.medecin.user.prenom[0]}{appointment.medecin.user.nom[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-sm">
                Dr. {appointment.medecin.user.prenom} {appointment.medecin.user.nom}
              </p>
              <p className="text-white/70 text-[10px] font-bold mt-0.5">
                {appointment.medecin.specialite.replace(/_/g, ' ')}
              </p>
            </div>
            {/* Statut actuel */}
            <div className="bg-white/20 rounded-xl px-3 py-1.5 shrink-0">
              <p className="text-white/60 text-[9px] font-bold uppercase">RDV actuel</p>
              <p className="text-white font-black text-xs mt-0.5">
                {fmtDate(appointment.date)} · {fmtTime(appointment.date)}
              </p>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all shrink-0">
              <X size={15}/>
            </button>
          </div>
        </div>

        {/* ── Contenu scrollable ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">

          {/* Erreur de chargement des slots */}
          {slotsError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2">
              <AlertCircle size={13} className="text-red-500 shrink-0 mt-0.5"/>
              <p className="text-[11px] font-bold text-red-700">{slotsError}</p>
            </div>
          )}

          {/* Erreur de reschedule */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2">
              <AlertCircle size={13} className="text-red-500 shrink-0 mt-0.5"/>
              <p className="text-[11px] font-bold text-red-700">{error}</p>
            </div>
          )}

          {/* ── Bloc Modifier la date ─────────────────────────────────────── */}
          {isEditable && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                Choisir un nouveau créneau
              </p>

              {slotsLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"/>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
                  <RescheduleCalendar
                    creneaux={creneaux}
                    absences={absences}
                    selDateKey={selDateKey}
                    selCreneauId={selCreneauId}
                    onSelectDate={handleSelectDate}
                    onSelectCreneau={handleSelectCreneau}
                    gradient={gradient}
                  />
                </div>
              )}

              {/* Récap du créneau sélectionné */}
              {selCreneau && (
                <div className={`mt-4 bg-gradient-to-r ${gradient} rounded-2xl p-4 flex items-center gap-4`}>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <Check size={18} className="text-white"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Nouveau créneau sélectionné</p>
                    <p className="text-white font-black text-sm mt-0.5 capitalize">
                      {fmtDayLong(selDateKey)} à {fmtTime(selCreneau.debut)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Infos RDV ────────────────────────────────────────────────── */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-5 pt-4 pb-3">
              Détails du rendez-vous
            </p>
            {[
              { icon: <Calendar size={13}/>, label: 'Date', value: fmtDate(appointment.date) },
              { icon: <Clock size={13}/>, label: 'Heure', value: fmtTime(appointment.date) },
              ...(appointment.motif ? [{ icon: <Stethoscope size={13}/>, label: 'Motif', value: appointment.motif }] : []),
              ...(appointment.medecin.adresseCabinet ? [{ icon: <MapPin size={13}/>, label: 'Cabinet', value: appointment.medecin.adresseCabinet }] : []),
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-3 border-t border-slate-100">
                <span className="text-slate-300 shrink-0">{icon}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide w-16 shrink-0">{label}</span>
                <span className="text-xs font-bold text-slate-700 flex-1">{value}</span>
              </div>
            ))}
          </div>

          {/* ── Zone annulation ──────────────────────────────────────────── */}
          {isEditable && (
            <div className="border border-red-100 bg-red-50 rounded-2xl p-4">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Zone dangereuse</p>
              <p className="text-[10px] font-bold text-red-400 mb-3">L'annulation est irréversible.</p>
              {showConfirmCancel ? (
                <div className="space-y-2">
                  <p className="text-xs font-black text-red-700">Confirmer l'annulation de ce rendez-vous ?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowConfirmCancel(false)}
                      className="flex-1 py-2 bg-white border border-red-200 rounded-xl text-xs font-black text-red-400 hover:bg-red-50 transition-all">
                      Non, garder
                    </button>
                    <button onClick={handleCancel} disabled={cancelling}
                      className="flex-[2] py-2 bg-red-500 text-white rounded-xl text-xs font-black hover:bg-red-600 disabled:opacity-60 transition-all flex items-center justify-center gap-1.5">
                      {cancelling ? <><RefreshCw size={12} className="animate-spin"/> Annulation...</> : <><Trash2 size={12}/> Oui, annuler</>}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowConfirmCancel(true)}
                  className="w-full py-2.5 bg-red-500 text-white rounded-xl text-xs font-black hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                  <Trash2 size={13}/> Annuler ce rendez-vous
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="px-7 py-5 border-t border-slate-100 flex gap-3 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all">
            Fermer
          </button>
          {isEditable && (
            <button
              disabled={!selCreneauId || rescheduling}
              onClick={handleReschedule}
              className={`flex-[2] py-3 bg-gradient-to-r ${gradient} text-white rounded-2xl text-sm font-black shadow-lg disabled:opacity-40 flex items-center justify-center gap-2 transition-all hover:opacity-90`}>
              {rescheduling
                ? <><RefreshCw size={14} className="animate-spin"/> Modification...</>
                : <><Check size={14}/> Confirmer le changement</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}