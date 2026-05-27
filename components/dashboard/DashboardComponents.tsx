'use client';

import { Calendar, ChevronRight, Filter, Search, X, Phone, RefreshCw } from 'lucide-react';
import { SPEC_DATA } from '@/constants/patient.config';
import { fmtDate, fmtTime, imageUrl } from '@/utils/date.utils';
import type { Medecin, Appointment } from '@/types/patient.types';

// ─── HeroSection ──────────────────────────────────────────────────────────────

type HeroSectionProps = {
  prenom:      string;
  prochainRdv: Appointment | undefined;
  onRdvClick:  () => void;
};

export function HeroSection({ prenom, prochainRdv, onRdvClick }: HeroSectionProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-8 rounded-3xl text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-24 translate-x-24" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
      <div className="relative z-10">
        <p className="text-emerald-100/70 text-sm font-bold capitalize">
          {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
        </p>
        <h1 className="text-3xl font-black mt-1 mb-4">
          Bonjour, <span className="text-emerald-200">{prenom || 'Patient'}</span> 👋
        </h1>
        {prochainRdv ? (
          <div
            className="inline-flex items-center gap-3 bg-white/15 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/20 cursor-pointer hover:bg-white/20 transition-all"
            onClick={onRdvClick}
          >
            <Calendar size={16} className="text-emerald-200" />
            <div>
              <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">Prochain RDV</p>
              <p className="text-sm font-black">
                {fmtDate(prochainRdv.date)} à {fmtTime(prochainRdv.date)} · Dr. {prochainRdv.medecin?.user?.nom}
              </p>
            </div>
            <ChevronRight size={14} />
          </div>
        ) : (
          <p className="text-emerald-100/60 text-sm font-bold">
            Trouvez un médecin et réservez votre créneau ci-dessous.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── SearchBar ────────────────────────────────────────────────────────────────

type SearchBarProps = {
  searchMed:     string;
  showFilters:   boolean;
  selectedSpec:  string;
  selectedVille: string;
  specialites:   string[];
  villes:        string[];
  onSearch:      (v: string) => void;
  onToggleFilters: () => void;
  onSpecChange:  (v: string) => void;
  onVilleChange: (v: string) => void;
  onReset:       () => void;
};

export function SearchBar({
  searchMed, showFilters, selectedSpec, selectedVille,
  specialites, villes,
  onSearch, onToggleFilters, onSpecChange, onVilleChange, onReset,
}: SearchBarProps) {
  const hasFilters = !!selectedSpec || !!selectedVille;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input
            value={searchMed}
            onChange={e => onSearch(e.target.value)}
            placeholder="Rechercher un médecin, spécialité, ville..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-emerald-300 transition-all shadow-sm placeholder:text-slate-300"
          />
        </div>
        <button
          onClick={onToggleFilters}
          className={`px-4 py-3 rounded-2xl border text-sm font-black transition-all flex items-center gap-2 ${
            showFilters || hasFilters
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white border-slate-100 text-slate-500 hover:border-emerald-200'
          }`}
        >
          <Filter size={15} /> Filtres
        </button>
      </div>

      {showFilters && (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Spécialité</label>
              <select
                value={selectedSpec}
                onChange={e => onSpecChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-emerald-300"
              >
                <option value="">Toutes</option>
                {specialites.map(s => (
                  <option key={s} value={s}>{(SPEC_DATA[s] ?? SPEC_DATA.default).label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Ville</label>
              <select
                value={selectedVille}
                onChange={e => onVilleChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-emerald-300"
              >
                <option value="">Toutes</option>
                {villes.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          {hasFilters && (
            <button onClick={onReset} className="text-[10px] font-black text-red-400 hover:text-red-600 flex items-center gap-1">
              <X size={11} /> Effacer les filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SpecialitesGrid ──────────────────────────────────────────────────────────

type SpecialitesGridProps = {
  specialites: string[];
  medecins:    Medecin[];
  onSelect:    (spec: string) => void;
};

export function SpecialitesGrid({ specialites, medecins, onSelect }: SpecialitesGridProps) {
  return (
    <div>
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Spécialités</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {specialites.map(spec => {
          const cfg   = SPEC_DATA[spec] ?? SPEC_DATA.default;
          const Icon  = cfg.icon;
          const count = medecins.filter(m => m.specialite === spec).length;
          return (
            <button
              key={spec}
              onClick={() => onSelect(spec)}
              className="flex flex-col items-center p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-300 hover:shadow-sm group transition-all"
            >
              <div className={`w-10 h-10 ${cfg.bg} ${cfg.color} rounded-xl flex items-center justify-center mb-2 group-hover:bg-emerald-500 group-hover:text-white transition-colors`}>
                <Icon size={20} />
              </div>
              <span className="text-xs font-bold text-slate-700 text-center leading-tight">{cfg.label}</span>
              <span className="text-[9px] font-bold text-slate-400 mt-0.5">{count} médecin{count > 1 ? 's' : ''}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── MedecinCard ──────────────────────────────────────────────────────────────

type MedecinCardProps = {
  medecin:       Medecin;
  hasRdv:        boolean;
  isLoading:     boolean;
  onBook:        () => void;
  onViewProfile: () => void;
};

export function MedecinCard({ medecin: m, hasRdv, isLoading, onBook, onViewProfile }: MedecinCardProps) {
  const cfg = SPEC_DATA[m.specialite] ?? SPEC_DATA.default;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all">
      <div className="p-5">
        <div className="flex items-start gap-4">

          {/* Avatar */}
          <button
            onClick={onViewProfile}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${cfg.bg} ${cfg.color} hover:ring-4 hover:ring-emerald-200 transition-all overflow-hidden`}
          >
            {m.user.photoProfil
              ? <img src={imageUrl(m.user.photoProfil)} alt="" className="w-full h-full object-cover" />
              : <>{m.user.prenom[0]}{m.user.nom[0]}</>
            }
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <button onClick={onViewProfile} className="font-black text-slate-800 hover:text-emerald-700 transition-colors text-left">
                  Dr. {m.user.prenom} {m.user.nom}
                </button>
                <p className={`text-[10px] font-bold uppercase tracking-wide mt-0.5 ${cfg.color}`}>{cfg.label}</p>
              </div>
              {hasRdv && (
                <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg shrink-0">
                  RDV actif
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-2 flex-wrap text-[10px] font-bold text-slate-400">
              {m.user.ville         && <span>{m.user.ville}</span>}
              {m.experience_annees  && <span>{m.experience_annees} ans d'exp.</span>}
              {m.tarif_consultation && <span className="font-black text-emerald-600">{String(m.tarif_consultation)} TND</span>}
            </div>

            {m.description && (
              <p className="text-[10px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">{m.description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
          <button
            onClick={onBook}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all disabled:opacity-60"
          >
            {isLoading
              ? <><RefreshCw size={13} className="animate-spin" /> Chargement...</>
              : <><Calendar size={13} /> {hasRdv ? 'Modifier le RDV' : 'Prendre RDV'}</>
            }
          </button>

          {m.user.telephone && (
            <a
              href={`tel:${m.user.telephone}`}
              className="flex items-center justify-center px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-100 border border-slate-100 transition-all shrink-0"
            >
              <Phone size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}