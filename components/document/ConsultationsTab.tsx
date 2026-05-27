// components/document/ConsultationsTab.tsx
'use client';

import { useState } from 'react';
import {
  Calendar, Stethoscope, CheckCircle2, Clock, XCircle,
  Heart, Activity, Pill, FileText, Phone, Droplets, Search, X,
} from 'lucide-react';
import { EmptyState, SectionHeader } from '@/components/ui/dossier-ui';
import { fmtDateLong, STATUT_META, getInitials } from '@/utils/dossier';
import type { Appointment, UserProfile } from '@/types/dossier.types';

// ─── Calcul âge ───────────────────────────────────────────────────────────────
function calcAge(dateNaissance?: string): number | null {
  if (!dateNaissance) return null;
  const diff = Date.now() - new Date(dateNaissance).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

// ─── Profil médical ───────────────────────────────────────────────────────────
function ProfileMedical({ user }: { user: UserProfile }) {
  const age = calcAge(user.dateNaissance);

  const infos = [
    user.telephone     && { icon: <Phone    size={13} />, label: 'Téléphone',      value: user.telephone },
    user.email         && { icon: <span className="text-xs">✉️</span>, label: 'Email', value: user.email },
    age !== null       && { icon: <Calendar size={13} />, label: 'Âge',            value: `${age} ans`   },
    user.groupeSanguin && { icon: <Droplets size={13} />, label: 'Groupe sanguin', value: user.groupeSanguin },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  const medical = [
    user.allergies?.length        && { icon: <span>⚠️</span>,      label: 'Allergies',               value: Array.isArray(user.allergies) ? user.allergies.join(', ') : user.allergies, color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-100'    },
    user.maladies_chroniques      && { icon: <Activity size={13} />,label: 'Maladies chroniques',     value: user.maladies_chroniques,   color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    user.medicaments_actuels      && { icon: <Pill     size={13} />,label: 'Traitements en cours',    value: user.medicaments_actuels,   color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100'   },
    user.antecedents_chirurgicaux && { icon: <FileText size={13} />,label: 'Antécédents chirurgicaux',value: user.antecedents_chirurgicaux, color: 'text-purple-600',bg: 'bg-purple-50',border: 'border-purple-100' },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; color: string; bg: string; border: string }[];

  return (
    <div className="space-y-4">
      {/* Carte identité */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0">
            {getInitials(user.prenom, user.nom)}
          </div>
          <div>
            <p className="text-xl font-black text-slate-800">{user.prenom} {user.nom}</p>
            <p className="text-sm font-bold text-slate-400">Patient</p>
          </div>
          {(user.poids || user.taille) && (
            <div className="ml-auto flex gap-2">
              {user.poids  && <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-500">{user.poids} kg</span>}
              {user.taille && <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-500">{user.taille} cm</span>}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {infos.map(({ icon, label, value }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                {icon}
                <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
              </div>
              <p className="text-xs font-bold text-slate-700 truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Infos médicales */}
      {medical.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Heart size={12} /> Informations médicales
          </p>
          <div className="space-y-3">
            {medical.map(({ icon, label, value, color, bg, border }) => (
              <div key={label} className={`p-4 ${bg} border ${border} rounded-2xl`}>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5 ${color}`}>
                  {icon} {label}
                </p>
                <p className="text-sm font-bold text-slate-700 leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ligne rendez-vous ────────────────────────────────────────────────────────
function StatutIcon({ statut }: { statut: string }) {
  if (statut === 'TERMINE') return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (statut === 'ANNULE')  return <XCircle      size={14} className="text-red-400"     />;
  return <Clock size={14} className="text-amber-400" />;
}

function AppointmentRow({ a }: { a: Appointment }) {
  const meta = STATUT_META[a.statut] ?? STATUT_META[Object.keys(STATUT_META)[0]];
  return (
    <div className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all">
      <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500 shrink-0 mt-0.5">
        <Stethoscope size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-black text-slate-800 text-sm">
            Dr. {a.medecin?.user?.prenom} {a.medecin?.user?.nom}
          </p>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${meta.color} bg-opacity-10`}>
            {meta.label}
          </span>
        </div>
        <p className="text-xs text-slate-400 font-bold mt-0.5">
          {a.medecin?.specialite} · {fmtDateLong(a.date)}
        </p>
        {a.motif && (
          <p className="text-xs text-slate-500 font-bold mt-1">{a.motif}</p>
        )}
        {a.consultation?.diagnostic && (
          <p className="text-xs text-emerald-600 mt-1 font-bold truncate">
            🩺 {a.consultation.diagnostic}
          </p>
        )}
        {a.consultation?.prescription && (
          <p className="text-[10px] text-blue-500 font-bold mt-0.5 truncate">
            💊 {a.consultation.prescription.split('\n')[0]}…
          </p>
        )}
      </div>
      <StatutIcon statut={a.statut} />
    </div>
  );
}

// ─── ConsultationsTab ─────────────────────────────────────────────────────────
interface ConsultationsTabProps {
  user:         UserProfile | null;
  appointments: Appointment[];
}

export function ConsultationsTab({ user, appointments }: ConsultationsTabProps) {
  const [search, setSearch] = useState('');

  const sorted = [...appointments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const filtered = sorted.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.medecin?.user?.nom?.toLowerCase().includes(q)        ||
      a.medecin?.user?.prenom?.toLowerCase().includes(q)     ||
      a.medecin?.specialite?.toLowerCase().includes(q)       ||
      a.consultation?.diagnostic?.toLowerCase().includes(q)  ||
      a.motif?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {user && <ProfileMedical user={user} />}

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <p className="font-black text-slate-800">Historique des consultations</p>
            <p className="text-xs text-slate-400 font-bold mt-0.5">
              {filtered.length} consultation{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Médecin, diagnostic…"
              className="pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-400 outline-none placeholder:text-slate-300 w-52"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Calendar size={40} />}
            title={search ? 'Aucun résultat' : 'Aucune consultation'}
            subtitle={search ? 'Essayez un autre terme.' : 'Votre historique apparaîtra ici après votre première consultation.'}
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(a => <AppointmentRow key={a.id} a={a} />)}
          </div>
        )}
      </div>
    </div>
  );
}