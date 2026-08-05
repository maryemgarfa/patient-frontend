// app/patient/rdv/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  ChevronLeft, ChevronRight, CheckCircle, Calendar,
  Clock, Plus, Stethoscope, Brain, Sparkles,
} from 'lucide-react';
import { ReschedulePopup }        from '@/components/rdv/ReschedulePopup';
import { BookingStepperModal }    from '@/components/rdv/BookingStepperModal';
import { PreConsultationModal }   from '@/components/rdv/PreConsultationModal';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type StatutKey = 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'TERMINE';

const S: Record<StatutKey, { label: string; bg: string; text: string; dot: string; border: string }> = {
  EN_ATTENTE: { label: 'En attente', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',  border: 'border-amber-200'  },
  CONFIRME:   { label: 'Confirmé',   bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500',border: 'border-emerald-200'},
  ANNULE:     { label: 'Annulé',     bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400',    border: 'border-red-200'    },
  TERMINE:    { label: 'Terminé',    bg: 'bg-slate-100',  text: 'text-slate-500',   dot: 'bg-slate-400',  border: 'border-slate-200'  },
};

type Appointment = {
  id: string; date: string; motif?: string; statut: StatutKey;
  medecin: {
    id: string; specialite: string;
    adresseCabinet?: string; tarif_consultation?: number;
    user: { nom: string; prenom: string };
  };
  consultation?: { diagnostic: string; prescription?: string };
  // ✅ NOUVEAU : indique si la pré-consultation a déjà été envoyée
  preconsultationEnvoyee?: boolean;
};

type Medecin = {
  id: string; specialite: string; tarif_consultation?: number;
  experience_annees?: number; adresseCabinet?: string;
  user: { nom: string; prenom: string; ville?: string };
};

// ─── UTILITAIRES ─────────────────────────────────────────────────────────────

const fmt  = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtT = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function PatientRdvPage() {
  const now = new Date();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medecins,     setMedecins]     = useState<Medecin[]>([]);
  const [loading,      setLoading]      = useState(true);

  const [calM,   setCalM]   = useState(now.getMonth());
  const [calY,   setCalY]   = useState(now.getFullYear());
  const [selDay, setSelDay] = useState<number | null>(now.getDate());
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  const [popup,       setPopup]       = useState<Appointment | null>(null);
  const [showStepper, setShowStepper] = useState(false);

  // ✅ NOUVEAU : état pré-consultation
  const [preConsultRdv, setPreConsultRdv] = useState<Appointment | null>(null);

  const [toast,     setToast]     = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const load = async () => {
    const [aRes, mRes] = await Promise.all([
      api.get('/appointments/patient/my-appointments'),
      api.get('/doctors/list'),
    ]);
    setAppointments(aRes.data);
    setMedecins(mRes.data);
  };

  useEffect(() => { load().catch(console.error).finally(() => setLoading(false)); }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg); setToastType(type); setTimeout(() => setToast(''), 3500);
  };

  // ✅ NOUVEAU : vérifie si un RDV peut avoir le bouton pré-consultation
  // Conditions : statut CONFIRME + date future + pas encore envoyé
  const canPreConsult = (a: Appointment): boolean => {
    return (
      a.statut === 'CONFIRME' &&
      new Date(a.date) > now &&
      !a.preconsultationEnvoyee
    );
  };

  const rdvByDay = appointments.reduce<Record<number, Appointment[]>>((acc, a) => {
    const d = new Date(a.date);
    if (d.getMonth() === calM && d.getFullYear() === calY) {
      const day = d.getDate();
      if (!acc[day]) acc[day] = [];
      acc[day].push(a);
    }
    return acc;
  }, {});

  const dayApps = selDay
    ? appointments
        .filter(a => {
          const d = new Date(a.date);
          return d.getDate() === selDay && d.getMonth() === calM && d.getFullYear() === calY;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  const daysInMonth = new Date(calY, calM + 1, 0).getDate();
  const firstDay    = (new Date(calY, calM, 1).getDay() + 6) % 7;

  const filteredApps = appointments
    .filter(a => {
      if (filter === 'upcoming') return new Date(a.date) > now && a.statut !== 'ANNULE';
      if (filter === 'past')     return new Date(a.date) <= now || a.statut === 'ANNULE' || a.statut === 'TERMINE';
      return true;
    })
    .sort((a, b) =>
      filter === 'past'
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

  const upcomingCount = appointments.filter(a => new Date(a.date) > now && a.statut !== 'ANNULE').length;
  const pendingCount  = appointments.filter(a => a.statut === 'EN_ATTENTE').length;

  if (loading) return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* En-tête */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Mes rendez-vous</h1>
          <p className="text-slate-400 text-sm font-bold mt-0.5">
            {upcomingCount} à venir
            {pendingCount > 0 && <> · <span className="text-amber-600">{pendingCount} en attente</span></>}
          </p>
        </div>
        <button
          onClick={() => setShowStepper(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-black hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
        >
          <Plus size={16}/> Prendre un rendez-vous
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'À venir',    value: upcomingCount,                                           color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'En attente', value: pendingCount,                                            color: 'text-amber-600',   bg: 'bg-amber-50'   },
          { label: 'Terminés',   value: appointments.filter(a => a.statut === 'TERMINE').length, color: 'text-slate-600',   bg: 'bg-slate-50'   },
          { label: 'Annulés',    value: appointments.filter(a => a.statut === 'ANNULE').length,  color: 'text-red-500',     bg: 'bg-red-50'     },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-white`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-12 gap-6">

        {/* Mini-calendrier latéral */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sticky top-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-black text-slate-800 capitalize">
                {new Date(calY, calM).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-1.5">
                <button
                  onClick={() => { calM === 0 ? (setCalM(11), setCalY(y => y - 1)) : setCalM(m => m - 1); }}
                  className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 border border-slate-100 transition-all"
                >
                  <ChevronLeft size={13}/>
                </button>
                <button
                  onClick={() => { calM === 11 ? (setCalM(0), setCalY(y => y + 1)) : setCalM(m => m + 1); }}
                  className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 border border-slate-100 transition-all"
                >
                  <ChevronRight size={13}/>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {['L','M','M','J','V','S','D'].map((j, i) => (
                <div key={i} className="text-center text-[9px] font-black text-slate-300 uppercase">{j}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`}/>)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day   = i + 1;
                const rdvs  = rdvByDay[day] ?? [];
                const today = day === now.getDate() && calM === now.getMonth() && calY === now.getFullYear();
                const isSel = day === selDay;
                const past  = new Date(calY, calM, day, 23, 59) < now;
                const conf  = rdvs.some(a => a.statut === 'CONFIRME');
                const wait  = rdvs.some(a => a.statut === 'EN_ATTENTE');
                return (
                  <button key={day} onClick={() => setSelDay(day === selDay ? null : day)}
                    className={`relative h-9 flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      today && isSel ? 'bg-emerald-600 text-white shadow-sm' :
                      today         ? 'bg-slate-900 text-white' :
                      isSel         ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      past          ? 'text-slate-300' :
                                      'text-slate-600 hover:bg-slate-50'
                    }`}>
                    {day}
                    {rdvs.length > 0 && (
                      <div className="flex gap-0.5 absolute bottom-1">
                        {conf && <span className="w-1 h-1 bg-emerald-500 rounded-full"/>}
                        {wait && <span className="w-1 h-1 bg-amber-400 rounded-full"/>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selDay !== null && (
              <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  {selDay} {new Date(calY, calM).toLocaleDateString('fr-FR', { month: 'long' })} · {dayApps.length} RDV
                </p>
                {dayApps.length === 0 ? (
                  <p className="text-xs font-bold text-slate-300 italic text-center py-3">Aucun RDV ce jour</p>
                ) : dayApps.map(a => {
                  const cfg = S[a.statut];
                  return (
                    <button key={a.id} onClick={() => setPopup(a)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border mb-2 text-left hover:shadow-sm transition-all ${cfg.bg} ${cfg.border}`}>
                      <div>
                        <p className="text-xs font-black text-slate-800">{fmtT(a.date)}</p>
                        <p className={`text-[9px] font-bold ${cfg.text}`}>{cfg.label}</p>
                      </div>
                      <p className="text-xs font-bold text-slate-600 truncate flex-1">Dr. {a.medecin?.user?.nom}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Liste des RDV */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-fit">
            {[
              { k: 'upcoming', l: `À venir (${upcomingCount})` },
              { k: 'all',      l: `Tous (${appointments.length})` },
              { k: 'past',     l: 'Passés' },
            ].map(f => (
              <button key={f.k} onClick={() => setFilter(f.k as any)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  filter === f.k ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}>
                {f.l}
              </button>
            ))}
          </div>

          {filteredApps.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
              <Stethoscope className="mx-auto text-slate-200 mb-3" size={36}/>
              <p className="text-slate-400 font-bold italic text-sm mb-4">Aucun rendez-vous</p>
              {filter === 'upcoming' && (
                <button onClick={() => setShowStepper(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl text-sm font-black hover:bg-emerald-700 mx-auto">
                  <Plus size={14}/> Prendre un RDV
                </button>
              )}
            </div>
          ) : filteredApps.map(a => {
            const cfg     = S[a.statut];
            const canEdit = new Date(a.date) > now && (a.statut === 'EN_ATTENTE' || a.statut === 'CONFIRME');

            return (
              <div key={a.id}
                className={`w-full bg-white rounded-[1.75rem] border-2 shadow-sm transition-all ${
                  a.statut === 'ANNULE' ? 'opacity-60 border-slate-100' : cfg.border
                }`}>
                {/* Carte RDV cliquable */}
                <button onClick={() => setPopup(a)} className="w-full text-left group">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-base font-black shrink-0 ${cfg.bg} ${cfg.text}`}>
                          {a.medecin?.user?.prenom?.[0]}{a.medecin?.user?.nom?.[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-slate-800">Dr. {a.medecin?.user?.prenom} {a.medecin?.user?.nom}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{a.medecin?.specialite?.replace(/_/g, ' ')}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap text-[10px] font-bold text-slate-500">
                            <span className="flex items-center gap-1.5"><Calendar size={10}/> {fmt(a.date)}</span>
                            <span className="flex items-center gap-1.5"><Clock size={10}/> {fmtT(a.date)}</span>
                            {a.motif && <span className="text-slate-400 truncate max-w-[140px]">{a.motif}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black ${cfg.bg} ${cfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>{cfg.label}
                        </span>
                        {canEdit && (
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-wide group-hover:text-emerald-500 transition-colors">
                            Gérer →
                          </span>
                        )}
                      </div>
                    </div>
                    {a.consultation?.diagnostic && (
                      <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Diagnostic</p>
                        <p className="text-xs font-bold text-slate-700 truncate">{a.consultation.diagnostic}</p>
                      </div>
                    )}
                  </div>
                </button>

                {/* ✅ NOUVEAU : Bouton Préparer ma consultation */}
                {canPreConsult(a) && (
                  <div className="px-5 pb-5">
                    <button
                      onClick={() => setPreConsultRdv(a)}
                      className="w-full flex items-center justify-center gap-2.5 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-violet-200 hover:opacity-90 transition-all"
                    >
                      <Brain size={14} />
                      Préparer ma consultation avec l'IA
                      <Sparkles size={12} />
                    </button>
                  </div>
                )}

                {/* ✅ Badge : pré-consultation déjà envoyée */}
                {a.statut === 'CONFIRME' && a.preconsultationEnvoyee && new Date(a.date) > now && (
                  <div className="px-5 pb-5">
                    <div className="flex items-center gap-2 py-2.5 px-4 bg-violet-50 border border-violet-100 rounded-2xl">
                      <CheckCircle size={13} className="text-violet-500" />
                      <p className="text-xs font-bold text-violet-600">
                        Résumé de pré-consultation envoyé au médecin ✅
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Popup modification RDV */}
      {popup && (
        <ReschedulePopup
          appointment={popup}
          onClose={() => setPopup(null)}
          onRescheduled={async () => { setPopup(null); await load(); showToast('Date modifiée avec succès !'); }}
          onCancelled={async  () => { setPopup(null); await load(); showToast('Rendez-vous annulé'); }}
        />
      )}

      {/* ✅ NOUVEAU : Modal pré-consultation IA */}
      {preConsultRdv && (
        <PreConsultationModal
          appointmentId={preConsultRdv.id}
          medecinNom={`${preConsultRdv.medecin.user.prenom} ${preConsultRdv.medecin.user.nom}`}
          specialite={preConsultRdv.medecin.specialite}
          dateRdv={preConsultRdv.date}
          onClose={() => setPreConsultRdv(null)}
          onDone={async () => {
            setPreConsultRdv(null);
            await load();
            showToast('Résumé envoyé au médecin avec succès !');
          }}
        />
      )}

      {/* Stepper prise de RDV */}
      {showStepper && (
        <BookingStepperModal
          medecins={medecins}
          appointments={appointments}
          onClose={() => setShowStepper(false)}
          onDone={async () => { setShowStepper(false); await load(); showToast('Rendez-vous enregistré avec succès !'); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl animate-in slide-in-from-bottom-2 duration-300 text-sm font-bold ${
          toastType === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
        }`}>
          <CheckCircle size={16} className={toastType === 'error' ? 'text-white' : 'text-emerald-400'}/>
          {toast}
        </div>
      )}
    </div>
  );
}
