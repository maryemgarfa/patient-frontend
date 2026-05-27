// components/MedecinCalendar.tsx
//
// Composant calendrier réutilisable pour la prise de rendez-vous patient.
//
// Utilisation :
//   <MedecinCalendar
//     creneaux={creneaux}           // Creneau[] enrichis par useBookingSlots
//     absences={absences}           // Absence[]
//     disponibilites={disponibilites} // Disponibilite[] (fallback jours de travail)
//     selCreneauId={selCreneauId}
//     onSelectCreneau={setSelCreneauId}
//     gradient="from-emerald-400 to-teal-500"  // optionnel
//   />
//
// Ce composant ne fait AUCUN appel API. Il reçoit les données déjà enrichies
// par useBookingSlots, qui applique la règle métier correcte :
//   estReserve = true  ↔  RDV CONFIRME
//   estReserve = false ↔  libre (ou seulement EN_ATTENTE → disponible)

'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, Ban, Lock, AlertCircle } from 'lucide-react';
import {
  Creneau,
  Absence,
  Disponibilite,
  toLocalDateKey,
  buildDateKey,
  isSlotInAbsence,
  isDayFullyAbsent,
  isDayPartiallyAbsent,
} from '@/hooks/useBookingSlots';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MedecinCalendarProps {
  creneaux:        Creneau[];
  absences:        Absence[];
  disponibilites?: Disponibilite[];
  selCreneauId:    string;
  onSelectCreneau: (id: string) => void;
  gradient?:       string;
  loading?:        boolean;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const JOUR_TO_DOW: Record<string, number> = {
  DIMANCHE: 0, LUNDI: 1, MARDI: 2, MERCREDI: 3, JEUDI: 4, VENDREDI: 5, SAMEDI: 6,
};

const DEFAULT_GRADIENT = 'from-emerald-400 to-teal-500';

// ─── Helpers internes ─────────────────────────────────────────────────────────

function fmtTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDayLabel(dateKey: string): string {
  return new Date(dateKey + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function MedecinCalendar({
  creneaux,
  absences,
  disponibilites = [],
  selCreneauId,
  onSelectCreneau,
  gradient = DEFAULT_GRADIENT,
  loading = false,
}: MedecinCalendarProps) {
  const now = new Date();

  // ── Maps dérivées ──────────────────────────────────────────────────────────

  const creneauxByDate = useMemo(() => {
    const map: Record<string, Creneau[]> = {};
    creneaux.forEach(c => {
      const key = toLocalDateKey(c.debut);
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [creneaux]);

  // Jours qui ont au moins un créneau (toutes catégories)
  const daysWithAnyCreneau = useMemo(
    () => new Set(Object.keys(creneauxByDate)),
    [creneauxByDate]
  );

  // Jours qui ont au moins un créneau LIBRE (pas réservé, pas en absence)
  const daysWithFreeSlot = useMemo(() => {
    const s = new Set<string>();
    Object.entries(creneauxByDate).forEach(([key, crns]) => {
      if (crns.some(c => !c.estReserve && !isSlotInAbsence(c.debut, c.fin, absences))) {
        s.add(key);
      }
    });
    return s;
  }, [creneauxByDate, absences]);

  // Jours de travail déclarés (fallback si aucun créneau en base)
  const workDayKeys = useMemo(() => {
    const result = new Set<string>();
    if (!disponibilites.length) return result;
    const dowSet = new Set(
      disponibilites.map(d => JOUR_TO_DOW[d.jour]).filter(n => n !== undefined)
    );
    for (let i = 1; i <= 56; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      if (dowSet.has(d.getDay())) {
        const k = buildDateKey(d.getFullYear(), d.getMonth(), d.getDate());
        if (!isDayFullyAbsent(k, absences)) result.add(k);
      }
    }
    return result;
  }, [disponibilites, absences]);

  // Mois initial = premier créneau libre
  const initialDate = useMemo(() => {
    const first = creneaux
      .filter(c => !c.estReserve && !isSlotInAbsence(c.debut, c.fin, absences))
      .sort((a, b) => new Date(a.debut).getTime() - new Date(b.debut).getTime())[0];
    return first ? new Date(first.debut) : now;
  }, [creneaux, absences]);

  // ── État local ─────────────────────────────────────────────────────────────
  const [calY,    setCalY]    = useState(initialDate.getFullYear());
  const [calM,    setCalM]    = useState(initialDate.getMonth());
  const [selDate, setSelDate] = useState('');

  const daysInMonth    = new Date(calY, calM + 1, 0).getDate();
  const firstDayOfWeek = (new Date(calY, calM, 1).getDay() + 6) % 7;
  const isPastDay      = (d: number) => new Date(calY, calM, d, 23, 59, 59) < now;
  const canGoBack      = !(calM === now.getMonth() && calY === now.getFullYear());

  const prevMonth = () => {
    if (!canGoBack) return;
    if (calM === 0) { setCalM(11); setCalY(y => y - 1); } else setCalM(m => m - 1);
    setSelDate(''); onSelectCreneau('');
  };
  const nextMonth = () => {
    if (calM === 11) { setCalM(0); setCalY(y => y + 1); } else setCalM(m => m + 1);
    setSelDate(''); onSelectCreneau('');
  };

  // Créneaux du jour sélectionné, triés par heure
  const creneauxForDay = useMemo(() => {
    if (!selDate) return [];
    return (creneauxByDate[selDate] || [])
      .sort((a, b) => new Date(a.debut).getTime() - new Date(b.debut).getTime());
  }, [selDate, creneauxByDate]);

  const creneauxLibres = useMemo(
    () => creneauxForDay.filter(c => !c.estReserve && !isSlotInAbsence(c.debut, c.fin, absences)),
    [creneauxForDay, absences]
  );

  const amCreneaux = useMemo(
    () => creneauxForDay.filter(c => new Date(c.debut).getHours() < 13),
    [creneauxForDay]
  );
  const pmCreneaux = useMemo(
    () => creneauxForDay.filter(c => new Date(c.debut).getHours() >= 13),
    [creneauxForDay]
  );

  const hasAnyFree = creneaux.some(
    c => !c.estReserve && !isSlotInAbsence(c.debut, c.fin, absences)
  );

  const selDateLabel = selDate ? fmtDayLabel(selDate) : '';

  // ── Rendu d'un créneau individuel ─────────────────────────────────────────
  const renderSlot = (c: Creneau) => {
    const isSel     = selCreneauId === c.id;
    const isAbsent  = isSlotInAbsence(c.debut, c.fin, absences);
    const isPast    = new Date(c.debut) <= now;
    // RÈGLE MÉTIER : bloqué seulement si confirmé (estReserve), absent ou passé
    const isBlocked = c.estReserve || isAbsent || isPast;

    return (
      <button
        key={c.id}
        disabled={isBlocked}
        onClick={() => !isBlocked && onSelectCreneau(c.id)}
        title={
          c.estReserve ? 'Créneau déjà confirmé'
          : isAbsent   ? 'Médecin absent'
          : isPast     ? 'Heure passée'
          : undefined
        }
        className={`relative py-2.5 px-2 rounded-xl text-xs font-black border-2 transition-all
          flex items-center justify-center gap-1 ${
          isSel
            ? `bg-gradient-to-br ${gradient} border-transparent text-white shadow-md scale-105`
          : isBlocked
            ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
            : 'bg-white text-slate-600 border-slate-100 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700'
        }`}
      >
        {!isSel && isAbsent      && <Ban  size={9} className="text-orange-300 shrink-0"/>}
        {!isSel && c.estReserve && !isAbsent && <Lock size={9} className="text-slate-300 shrink-0"/>}
        {!isSel && isPast && !c.estReserve && !isAbsent && <Clock size={9} className="text-slate-200 shrink-0"/>}
        <span className={isBlocked && !isSel ? 'line-through' : ''}>{fmtTime(c.debut)}</span>
      </button>
    );
  };

  // ── Rendu ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"/>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* ── Colonne gauche : calendrier ──────────────────────────────────── */}
      <div>
        {!hasAnyFree && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2">
            <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5"/>
            <p className="text-[10px] font-bold text-amber-700">
              Aucun créneau disponible pour ce médecin actuellement.
            </p>
          </div>
        )}

        {/* Navigation mois */}
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-black text-slate-800 capitalize">
            {new Date(calY, calM).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h4>
          <div className="flex gap-1.5">
            <button onClick={prevMonth} disabled={!canGoBack}
              className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 disabled:opacity-20 hover:bg-slate-200 transition-all">
              <ChevronLeft size={15}/>
            </button>
            <button onClick={nextMonth}
              className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all">
              <ChevronRight size={15}/>
            </button>
          </div>
        </div>

        {/* En-têtes jours */}
        <div className="grid grid-cols-7 mb-2">
          {['L','M','M','J','V','S','D'].map((d, i) => (
            <div key={i} className="text-center text-[9px] font-black text-slate-300 uppercase py-1.5">{d}</div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`}/>)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day      = i + 1;
            const dKey     = buildDateKey(calY, calM, day);
            const past     = isPastDay(day);
            const hasCrn   = daysWithAnyCreneau.has(dKey);
            const hasFree  = daysWithFreeSlot.has(dKey);
            const hasDispo = workDayKeys.has(dKey);
            const fullAbs  = !past && isDayFullyAbsent(dKey, absences);
            const partAbs  = !past && !fullAbs && isDayPartiallyAbsent(dKey, absences);
            const isActive = selDate === dKey;
            const isToday  = day === now.getDate() && calM === now.getMonth() && calY === now.getFullYear();
            const clickable = !past && !fullAbs && (hasCrn || hasDispo);

            return (
              <button
                key={day}
                disabled={!clickable}
                onClick={() => { if (clickable) { setSelDate(dKey); onSelectCreneau(''); }}}
                title={
                  fullAbs  ? 'Médecin absent toute la journée'
                  : partAbs ? 'Absence partielle ce jour'
                  : undefined
                }
                className={`relative h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                  isActive
                    ? `bg-gradient-to-br ${gradient} text-white shadow-lg scale-105`
                  : fullAbs
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  : isToday && hasFree
                    ? 'bg-slate-900 text-white'
                  : isToday && hasCrn
                    ? 'bg-slate-700 text-slate-300 cursor-default'
                  : isToday
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : past
                    ? 'text-slate-200 cursor-not-allowed'
                  : hasFree
                    ? 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-black'
                  : hasCrn
                    ? 'bg-slate-50 text-slate-300 hover:bg-slate-100 cursor-pointer'
                  : hasDispo
                    ? 'text-slate-400 hover:bg-blue-50 hover:text-blue-600'
                    : 'text-slate-200 cursor-not-allowed'
                }`}
              >
                {fullAbs ? (
                  <span className="relative">
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="w-5 h-px bg-slate-400 rotate-45 absolute"/>
                    </span>
                    <span className="relative text-slate-400">{day}</span>
                  </span>
                ) : day}

                {/* Points indicateurs */}
                {!past && !isActive && !fullAbs && (
                  hasFree   ? <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full"/>
                  : hasCrn  ? <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-slate-300 rounded-full"/>
                  : hasDispo ? <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-300 rounded-full"/>
                  : null
                )}
                {partAbs && !isActive && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-400 rounded-full"/>
                )}
              </button>
            );
          })}
        </div>

        {/* Légende */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-4 pt-3 border-t border-slate-100">
          {[
            ['bg-emerald-400', 'Disponible'],
            ['bg-slate-300',   'Complet (confirmé)'],
            ['bg-orange-400',  'Abs. partielle'],
            ['bg-slate-200',   'Fermé / Absent'],
          ].map(([c, l]) => (
            <span key={l} className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase">
              <span className={`w-2 h-2 rounded-full ${c}`}/>{l}
            </span>
          ))}
        </div>
      </div>

      {/* ── Colonne droite : créneaux ─────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
          {selDate
            ? `${creneauxLibres.length} libre${creneauxLibres.length > 1 ? 's' : ''} sur ${creneauxForDay.length} — ${selDateLabel}`
            : 'Créneaux horaires'}
        </p>

        {!selDate ? (
          <div className="h-52 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center gap-2">
            <Clock className="text-slate-200" size={22}/>
            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">Sélectionnez une date</p>
          </div>
        ) : creneauxForDay.length === 0 ? (
          <div className="h-52 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center gap-3 bg-slate-50/50">
            <Ban size={22} className="text-slate-300"/>
            <p className="text-xs font-black text-slate-500">Aucun créneau ce jour</p>
          </div>
        ) : (
          <div className="space-y-5 max-h-72 overflow-y-auto pr-1">
            {amCreneaux.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">🌤 Matin</p>
                <div className="grid grid-cols-4 gap-2">{amCreneaux.map(renderSlot)}</div>
              </div>
            )}
            {pmCreneaux.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">🌇 Après-midi</p>
                <div className="grid grid-cols-4 gap-2">{pmCreneaux.map(renderSlot)}</div>
              </div>
            )}
            {/* Légende créneaux */}
            <div className="flex gap-4 pt-2 border-t border-slate-50 text-[9px] font-black text-slate-400 uppercase">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/> Libre</span>
              <span className="flex items-center gap-1"><Lock size={8}/> Confirmé</span>
              <span className="flex items-center gap-1"><Ban  size={8}/> Absence</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}