'use client';
// components/BookingStepperModal.tsx
//
// Stepper de prise de rendez-vous — version refactorisée.
//
// Architecture :
//   - Étape 1 : sélection médecin  (chips spécialité + recherche + cards)
//   - Étape 2 : sélection créneau  → délègue à <MedecinCalendar> (composant centralisé)
//   - Étape 3 : récapitulatif + confirmation
//
// Ce composant ne duplique AUCUNE logique calendrier.
//   • useBookingSlots  → fetch + règle métier estReserve = CONFIRME seulement
//   • MedecinCalendar  → rendu calendrier + slots (composant réutilisable existant)

import { useState, useMemo } from 'react';
import {
  X, ChevronLeft, ArrowRight, CheckCircle,
  Search, MapPin, RefreshCw, AlertTriangle, Calendar,
} from 'lucide-react';
import api from '@/lib/api';
import { useBookingSlots } from '@/hooks/useBookingSlots';
import { MedecinCalendar } from './MedecinCalendar';
import { TriageStep } from '@/components/rdv/TriageStep';
import type { TriageResult } from '@/components/rdv/TriageStep';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatutKey = 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'TERMINE';

export interface MedecinForBooking {
  id: string;
  specialite: string;
  tarif_consultation?: number;
  experience_annees?: number;
  adresseCabinet?: string;
  user: { nom: string; prenom: string; ville?: string };
}

export interface AppointmentForBooking {
  id: string;
  date: string;
  statut: StatutKey;
  medecin: { id: string; user: { nom: string; prenom: string } };
}

interface Props {
  medecins:     MedecinForBooking[];
  appointments: AppointmentForBooking[];
  onClose:      () => void;
  onDone:       () => void;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const SPEC_META: Record<string, { icon: string; gradient: string; color: string }> = {
  CARDIOLOGIE:       { icon: '🫀', gradient: 'from-red-400 to-rose-500',      color: 'text-rose-600'    },
  NEUROLOGIE:        { icon: '🧠', gradient: 'from-purple-400 to-violet-600', color: 'text-violet-600'  },
  OPHTALMOLOGIE:     { icon: '👁',  gradient: 'from-blue-400 to-sky-500',      color: 'text-sky-600'     },
  MEDECINE_GENERALE: { icon: '🩺', gradient: 'from-emerald-400 to-teal-500',  color: 'text-emerald-600' },
  PEDIATRIE:         { icon: '👶', gradient: 'from-pink-400 to-rose-400',     color: 'text-pink-600'    },
  ORTHOPEDIE:        { icon: '🦴', gradient: 'from-amber-400 to-orange-500',  color: 'text-amber-600'   },
  DERMATOLOGIE:      { icon: '✨', gradient: 'from-orange-400 to-amber-500',  color: 'text-orange-600'  },
  GYNECOLOGIE:       { icon: '🌸', gradient: 'from-rose-400 to-pink-500',     color: 'text-rose-600'    },
  DENTISTE:          { icon: '🦷', gradient: 'from-cyan-400 to-blue-400',     color: 'text-cyan-600'    },
  PSYCHIATRE:        { icon: '💆', gradient: 'from-indigo-400 to-purple-500', color: 'text-indigo-600'  },
  NUTRITIONNISTE:    { icon: '🥗', gradient: 'from-lime-400 to-green-500',    color: 'text-lime-600'    },
};
const DEFAULT_META = { icon: '🩺', gradient: 'from-slate-400 to-slate-600', color: 'text-slate-600' };

const fmt  = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtT = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
function fmtDayLong(key: string) {
  return new Date(key + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ─── Étape 1 : Sélection médecin ─────────────────────────────────────────────

function StepChoixMedecin({
  medecins, appointments, selected, onSelect,
}: {
  medecins:     MedecinForBooking[];
  appointments: AppointmentForBooking[];
  selected:     MedecinForBooking | null;
  onSelect:     (m: MedecinForBooking) => void;
}) {
  const [search,     setSearch]     = useState('');
  const [filterSpec, setFilterSpec] = useState('');

  const specialites = useMemo(
    () => Array.from(new Set(medecins.map(m => m.specialite))).sort(),
    [medecins],
  );

  const filteredMeds = useMemo(() => {
    const s = search.toLowerCase();
    return medecins.filter(m =>
      (!s || `${m.user.prenom} ${m.user.nom} ${m.specialite} ${m.user.ville || ''}`.toLowerCase().includes(s))
      && (!filterSpec || m.specialite === filterSpec),
    );
  }, [medecins, search, filterSpec]);

  const rdvActif = selected
    ? appointments.find(a => a.medecin.id === selected.id && (a.statut === 'EN_ATTENTE' || a.statut === 'CONFIRME'))
    : null;

  return (
    <div className="p-7 space-y-5">

      {/* ── Barre de recherche ─────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={15}/>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
          placeholder="Rechercher par nom, ville..."
          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all"
        />
      </div>

      {/* ── Chips de spécialité ────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterSpec('')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all border ${
            !filterSpec
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          Toutes
        </button>
        {specialites.map(spec => {
          const meta    = SPEC_META[spec] ?? DEFAULT_META;
          const isActive = filterSpec === spec;
          const count   = medecins.filter(m => m.specialite === spec).length;
          return (
            <button
              key={spec}
              onClick={() => setFilterSpec(isActive ? '' : spec)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all border ${
                isActive
                  ? `bg-gradient-to-r ${meta.gradient} text-white border-transparent shadow-md`
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>{meta.icon}</span>
              <span>{spec.replace(/_/g, ' ')}</span>
              <span className={`text-[10px] ${isActive ? 'text-white/60' : 'text-slate-300'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Alerte RDV actif ───────────────────────────────────────────────── */}
      {rdvActif && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5"/>
          <p className="text-xs font-bold text-amber-700">
            RDV <strong>{rdvActif.statut === 'EN_ATTENTE' ? 'en attente' : 'confirmé'}</strong> existant le <strong>{fmt(rdvActif.date)}</strong>. Il sera mis à jour.
          </p>
        </div>
      )}

      {/* ── Liste des médecins ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
        {filteredMeds.length === 0 ? (
          <div className="col-span-2 py-16 flex flex-col items-center gap-2">
            <span className="text-4xl">🔍</span>
            <p className="text-slate-400 font-bold text-sm">Aucun médecin trouvé</p>
          </div>
        ) : filteredMeds.map(m => {
          const meta    = SPEC_META[m.specialite] ?? DEFAULT_META;
          const isSel   = selected?.id === m.id;
          const hasActif = appointments.some(a => a.medecin.id === m.id && (a.statut === 'EN_ATTENTE' || a.statut === 'CONFIRME'));

          return (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              className={`flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                isSel
                  ? 'border-emerald-400 bg-emerald-50/60 shadow-sm'
                  : hasActif
                  ? 'border-amber-200 bg-amber-50/30'
                  : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50'
              }`}
            >
              {/* Avatar gradient par spécialité */}
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white font-black text-base shrink-0 shadow-sm`}>
                {m.user.prenom[0]}{m.user.nom[0]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-black text-slate-800 truncate">Dr. {m.user.prenom} {m.user.nom}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wide mt-0.5 ${meta.color}`}>
                      {meta.icon} {m.specialite.replace(/_/g, ' ')}
                    </p>
                  </div>
                  {isSel && <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5"/>}
                </div>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-2">
                  {m.user.ville && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <MapPin size={9}/>{m.user.ville}
                    </span>
                  )}
                  {m.experience_annees && (
                    <span className="text-[10px] font-bold text-slate-400">{m.experience_annees} ans exp.</span>
                  )}
                  {m.tarif_consultation && (
                    <span className={`text-[10px] font-black ${meta.color}`}>{String(m.tarif_consultation)} TND</span>
                  )}
                </div>
                {hasActif && (
                  <span className="inline-block mt-1.5 text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                    RDV actif
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Étape 2 : Sélection créneau (délègue à MedecinCalendar) ─────────────────

function StepChoixCreneau({
  medecin, selCreneauId, onSelectCreneau,
}: {
  medecin:         MedecinForBooking;
  selCreneauId:    string;
  onSelectCreneau: (id: string) => void;
}) {
  const meta = SPEC_META[medecin.specialite] ?? DEFAULT_META;

  // ── Le hook centralisé : fetch + règle métier estReserve = CONFIRME ────────
  const { creneaux, absences, disponibilites, loading, error } = useBookingSlots(medecin.id);

  const selCreneau = creneaux.find(c => c.id === selCreneauId);
  const selDateKey = selCreneau
    ? new Date(selCreneau.debut).getFullYear() + '-'
      + String(new Date(selCreneau.debut).getMonth() + 1).padStart(2, '0') + '-'
      + String(new Date(selCreneau.debut).getDate()).padStart(2, '0')
    : '';

  return (
    <div className="p-7 space-y-5">

      {/* Récap médecin sélectionné */}
      <div className={`bg-gradient-to-r ${meta.gradient} rounded-2xl p-4 flex items-center gap-4`}>
        <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-base shrink-0">
          {medecin.user.prenom[0]}{medecin.user.nom[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-white text-sm">Dr. {medecin.user.prenom} {medecin.user.nom}</p>
          <p className="text-white/70 text-[10px] font-bold mt-0.5">{medecin.specialite.replace(/_/g, ' ')}</p>
        </div>
        {medecin.tarif_consultation && (
          <div className="bg-white/20 rounded-xl px-3 py-1.5 shrink-0 text-right">
            <p className="text-white font-black text-sm">{String(medecin.tarif_consultation)} TND</p>
            <p className="text-white/60 text-[9px] font-bold">consultation</p>
          </div>
        )}
      </div>

      {/* Erreur de chargement */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-xs font-bold text-red-700">{error}</p>
        </div>
      )}

      {/* ── MedecinCalendar — composant centralisé réutilisé ───────────────── */}
      <MedecinCalendar
        creneaux={creneaux}
        absences={absences}
        disponibilites={disponibilites}
        selCreneauId={selCreneauId}
        onSelectCreneau={onSelectCreneau}
        gradient={meta.gradient}
        loading={loading}
      />

      {/* Récap créneau sélectionné */}
      {selCreneau && (
        <div className={`bg-gradient-to-r ${meta.gradient} rounded-2xl p-4 flex items-center gap-4`}>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle size={18} className="text-white"/>
          </div>
          <div>
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Créneau sélectionné</p>
            <p className="text-white font-black text-sm mt-0.5 capitalize">
              {fmtDayLong(selDateKey)} à {fmtT(selCreneau.debut)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Étape 3 : Motif + Confirmation ──────────────────────────────────────────

function StepConfirmation({
  medecin, selCreneauId, creneaux, motif, onChangeMotif, error, rdvActif,
}: {
  medecin:        MedecinForBooking;
  selCreneauId:   string;
  creneaux:       ReturnType<typeof useBookingSlots>['creneaux'];
  motif:          string;
  onChangeMotif:  (v: string) => void;
  error:          string;
  rdvActif?:      AppointmentForBooking;
}) {
  const meta       = SPEC_META[medecin.specialite] ?? DEFAULT_META;
  const selCreneau = creneaux.find(c => c.id === selCreneauId);
  const selDateKey = selCreneau
    ? new Date(selCreneau.debut).getFullYear() + '-'
      + String(new Date(selCreneau.debut).getMonth() + 1).padStart(2, '0') + '-'
      + String(new Date(selCreneau.debut).getDate()).padStart(2, '0')
    : '';

  return (
    <div className="p-7 max-w-lg mx-auto space-y-5">

      {/* Avatar + titre */}
      <div className="text-center">
        <div className="relative inline-block">
          <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white font-black text-2xl mx-auto shadow-xl`}>
            {medecin.user.prenom[0]}{medecin.user.nom[0]}
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md">
            <Calendar size={14}/>
          </div>
        </div>
        <h3 className="text-lg font-black text-slate-800 mt-4">Récapitulatif</h3>
        <p className="text-xs font-bold text-slate-400 mt-0.5">Vérifiez avant de confirmer</p>
      </div>

      {/* Alerte mise à jour */}
      {rdvActif && (
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <RefreshCw size={13} className="text-amber-500 shrink-0 mt-0.5"/>
          <p className="text-xs font-bold text-amber-700">
            Le RDV du <strong>{fmt(rdvActif.date)}</strong> sera <strong>mis à jour</strong>.
          </p>
        </div>
      )}

      {/* Tableau récap */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
        {[
          { icon: '👨‍⚕️', label: 'Médecin',    value: `Dr. ${medecin.user.prenom} ${medecin.user.nom}` },
          { icon: meta.icon, label: 'Spécialité', value: medecin.specialite.replace(/_/g, ' ')         },
          { icon: '📅', label: 'Date',       value: selDateKey ? fmtDayLong(selDateKey) : '—'           },
          { icon: '🕐', label: 'Heure',      value: selCreneau ? fmtT(selCreneau.debut) : '—'           },
          { icon: '📍', label: 'Cabinet',    value: medecin.adresseCabinet || medecin.user.ville || '—' },
          { icon: '💰', label: 'Tarif',      value: medecin.tarif_consultation ? `${String(medecin.tarif_consultation)} TND` : 'À définir' },
        ].map(({ icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-100 last:border-0">
            <span className="w-6 text-center text-base shrink-0">{icon}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 w-20 shrink-0">{label}</span>
            <span className="text-sm font-bold text-slate-800 flex-1 capitalize">{value}</span>
          </div>
        ))}
      </div>

      {/* Motif */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
          Motif <span className="text-slate-300 normal-case font-bold">(optionnel)</span>
        </label>
        <input
          type="text"
          value={motif}
          onChange={e => onChangeMotif(e.target.value)}
          placeholder="Ex : douleurs, bilan annuel, suivi..."
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all"
        />
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-2xl">
          <p className="text-xs font-black text-red-600">{error}</p>
        </div>
      )}

      <p className="text-[10px] font-bold text-slate-400 text-center leading-relaxed">
        Le médecin devra valider votre rendez-vous.
      </p>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function BookingStepperModal({ medecins, appointments, onClose, onDone }: Props) {
  const [step,         setStep]         = useState<1 | 2 | 3 | 4>(1);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [selected,     setSelected]     = useState<MedecinForBooking | null>(null);
  const [selCreneauId, setSelCreneauId] = useState('');
  const [motif,        setMotif]        = useState('');
  const [creating,     setCreating]     = useState(false);
  const [error,        setError]        = useState('');

  // useBookingSlots ici pour avoir les creneaux dans l'étape 3 (récap)
  // (le même hook est aussi appelé dans StepChoixCreneau — React déduplique par medecinId)
  const { creneaux } = useBookingSlots(selected?.id ?? null);

  const rdvActif = selected
    ? appointments.find(a => a.medecin.id === selected.id && (a.statut === 'EN_ATTENTE' || a.statut === 'CONFIRME'))
    : null;

  const selCreneau = creneaux.find(c => c.id === selCreneauId);

  const handleSelectMedecin = (m: MedecinForBooking) => {
    setSelected(m);
    setSelCreneauId('');
    setError('');
  };

  const handleNext = () => {
    setError('');
    setStep(s => (s + 1) as any);
  };

  const handleBack = () => {
    setError('');
    if (step === 1) { onClose(); return; }
    setStep(s => (s - 1) as any);
  };

  const handleConfirm = async () => {
    if (!selected || !selCreneau) return;
    setCreating(true); setError('');
    try {
     await api.post('/appointments/patient/book', {
  medecinId: selected.id,
  date:      selCreneau.debut,
  motif:     motif || null,
});
      onDone();
    } catch (e: any) {
      const body = e.response?.data;
      setError(
        body?.code === 'SLOT_TAKEN'
          ? "Ce créneau vient d'être pris par un autre patient."
          : body?.message || 'Erreur lors de la réservation.',
      );
      setCreating(false);
    }
  };

  const canNext = step === 1 ? !!selected : step === 3 ? !!selCreneauId : step === 2 ? true : false;

  const STEPS = [
    { n: 1, label: 'Médecin'  },
    { n: 2, label: 'Triage IA'},
    { n: 3, label: 'Créneau'  },
    { n: 4, label: 'Confirmer'},
  ];

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-8 pt-7 pb-0 shrink-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Prendre un rendez-vous</h2>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                {step === 1 && 'Choisissez votre médecin'}
                {step === 2 && selected && `Dr. ${selected.user.prenom} ${selected.user.nom} — Choisissez un créneau`}
                {step === 3 && 'Vérifiez et confirmez'}
              </p>
            </div>
            <button onClick={onClose} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all">
              <X size={15}/>
            </button>
          </div>

          {/* Steps */}
          <div className="flex items-center border-b border-slate-100 -mx-8 px-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center flex-1">
                <button
                  onClick={() => {
                    if (s.n < step) setStep(s.n as any);
                    if (s.n === 2 && selected && step > 2) setStep(2);
                  }}
                  className={`flex items-center gap-2.5 pb-4 border-b-2 -mb-px transition-all ${
                    step === s.n ? 'border-emerald-500' :
                    step > s.n  ? 'border-emerald-200 cursor-pointer' :
                                  'border-transparent'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step > s.n   ? 'bg-emerald-500 text-white' :
                    step === s.n ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' :
                                   'bg-slate-100 text-slate-400'
                  }`}>
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <span className={`text-xs font-bold hidden sm:block ${
                    step === s.n ? 'text-emerald-700' :
                    step > s.n  ? 'text-emerald-500' :
                                  'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </button>
                {i < 2 && (
                  <div className={`flex-1 h-0.5 mx-3 mb-4 rounded-full transition-all ${
                    step > s.n ? 'bg-emerald-200' : 'bg-slate-100'
                  }`}/>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Contenu scrollable ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {step === 1 && (
            <StepChoixMedecin
              medecins={medecins}
              appointments={appointments}
              selected={selected}
              onSelect={handleSelectMedecin}
            />
          )}
          {step === 2 && selected && (
            <TriageStep
              specialiteMedecin={selected.specialite}
              onNext={(motifPrefill, triage) => {
                setMotif(motifPrefill);
                setTriageResult(triage);
                setStep(3);
              }}
              onSkip={() => setStep(3)}
            />
          )}
          {step === 3 && selected && (
            <StepChoixCreneau
              medecin={selected}
              selCreneauId={selCreneauId}
              onSelectCreneau={setSelCreneauId}
            />
          )}
          {step === 4 && selected && (
            <StepConfirmation
              medecin={selected}
              selCreneauId={selCreneauId}
              creneaux={creneaux}
              motif={motif}
              onChangeMotif={setMotif}
              error={error}
              rdvActif={rdvActif ?? undefined}
            />
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="px-8 py-5 border-t border-slate-100 flex justify-between items-center shrink-0 bg-white">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-200 transition-all"
          >
            {step === 1 ? <><X size={13}/> Annuler</> : <><ChevronLeft size={13}/> Retour</>}
          </button>

          {step < 4 && step !== 2 ? (
            <button
              onClick={handleNext}
              disabled={!canNext}
              className="flex items-center gap-2 px-7 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-black hover:bg-emerald-700 shadow-lg shadow-emerald-100 disabled:opacity-40 transition-all"
            >
              Suivant <ArrowRight size={14}/>
            </button>
          ) : step === 2 ? (
            <div/>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={creating}
              className="flex items-center gap-2 px-7 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-black hover:bg-emerald-700 shadow-lg shadow-emerald-100 disabled:opacity-50 transition-all"
            >
              {creating
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Envoi...</>
                : <><CheckCircle size={14}/> Confirmer le rendez-vous</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}