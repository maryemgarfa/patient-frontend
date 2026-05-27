'use client';

import Link from 'next/link';
import { Calendar, Phone, RefreshCw } from 'lucide-react';
import { SPEC_DATA } from '@/constants/patient.config';
import { imageUrl } from '@/utils/date.utils';
import type { Medecin } from '@/types/patient.types';

type MedecinCardProps = {
  medecin:       Medecin;
  hasRdv:        boolean;
  isLoading:     boolean;
  onBook:        () => void;
  onViewProfile: () => void;
};

export function MedecinCard({ medecin: m, hasRdv, isLoading, onBook }: MedecinCardProps) {
  const cfg = SPEC_DATA[m.specialite] ?? SPEC_DATA.default;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all">
      <div className="p-5">
        <div className="flex items-start gap-4">

          {/* Avatar → lien profil */}
          <Link
            href={`/medecin/${m.id}`}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${cfg.bg} ${cfg.color} hover:ring-4 hover:ring-emerald-200 transition-all overflow-hidden`}
          >
            {m.user.photoProfil
              ? <img src={imageUrl(m.user.photoProfil)} alt="" className="w-full h-full object-cover" />
              : <>{m.user.prenom[0]}{m.user.nom[0]}</>
            }
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                {/* Nom → lien profil */}
                <Link
                  href={`/medecin/${m.id}`}
                  className="font-black text-slate-800 hover:text-emerald-700 transition-colors"
                >
                  Dr. {m.user.prenom} {m.user.nom}
                </Link>
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