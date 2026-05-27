'use client';

import React from 'react';
import {
  Star, User, GraduationCap, Briefcase, MessageSquare,
  Images, ZoomIn, MapPin, Phone, Mail, Heart, X,
} from 'lucide-react';
import { imageUrl } from '@/utils/date.utils';
import type { MedecinProfile, TabKey, GaleriePhoto, Avis } from '@/types/profilMed.types';

// ─── StarRating ───────────────────────────────────────────────────────────────

export function StarRating({ note, size = 14 }: { note: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size}
          className={i <= note ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
      ))}
    </div>
  );
}

// ─── TabNav ───────────────────────────────────────────────────────────────────

type TabNavProps = {
  activeTab:    TabKey;
  avisCount:    number;
  galerieCount: number;
  gradient:     string;   // ex: from-red-400 to-rose-500
  onTabChange:  (t: TabKey) => void;
};

export function TabNav({ activeTab, avisCount, galerieCount, gradient, onTabChange }: TabNavProps) {
  const TABS: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'apropos', label: 'À propos', icon: <User size={14} /> },
    { key: 'avis',    label: 'Avis',     icon: <Star size={14} />,   count: avisCount    },
    { key: 'galerie', label: 'Galerie',  icon: <Images size={14} />, count: galerieCount },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-2 flex gap-1 shadow-sm">
      {TABS.map(t => (
        <button key={t.key} onClick={() => onTabChange(t.key)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all ${
            activeTab === t.key
              ? `bg-gradient-to-r ${gradient} text-white shadow-md`
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
          }`}>
          {t.icon} {t.label}
          {t.count !== undefined && t.count > 0 && (
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
              activeTab === t.key ? 'bg-white/60' : 'bg-slate-100'
            }`}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── TabApropos ───────────────────────────────────────────────────────────────

export function TabApropos({ medecin }: { medecin: MedecinProfile }) {
  if (!medecin.description && !medecin.diplome && !medecin.universite) {
    return (
      <div className="py-12 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
        <p className="text-slate-300 font-bold italic text-sm">Aucune information renseignée</p>
      </div>
    );
  }
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {medecin.description && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-7">
          <h2 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
            <User size={16} className="text-slate-400" /> À propos
          </h2>
          <p className="text-sm font-bold text-slate-600 leading-relaxed">{medecin.description}</p>
        </div>
      )}
      {(medecin.diplome || medecin.universite) && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-7">
          <h2 className="text-base font-black text-slate-800 mb-5 flex items-center gap-2">
            <GraduationCap size={16} className="text-slate-400" /> Formation
          </h2>
          <div className="space-y-4">
            {medecin.diplome && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                  <GraduationCap size={17} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diplôme</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{medecin.diplome}</p>
                </div>
              </div>
            )}
            {medecin.universite && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 shrink-0">
                  <Briefcase size={17} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Université</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{medecin.universite}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TabAvis ──────────────────────────────────────────────────────────────────

export function TabAvis({ avis, avgNote }: { avis: Avis[]; avgNote: number | null }) {
  const fmtShort = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  if (!avis.length) {
    return (
      <div className="py-16 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
        <MessageSquare className="mx-auto text-slate-200 mb-3" size={36} />
        <p className="text-slate-300 font-bold italic">Aucun avis pour ce médecin</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-6">
          <div className="text-center shrink-0">
            <p className="text-5xl font-black text-slate-900">{avgNote?.toFixed(1)}</p>
            <StarRating note={Math.round(avgNote ?? 0)} size={16} />
            <p className="text-[10px] font-bold text-slate-400 mt-1">{avis.length} avis</p>
          </div>
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map(star => {
              const count = avis.filter(a => a.note === star).length;
              const pct   = avis.length ? (count / avis.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 w-3">{star}</span>
                  <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 w-4">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {avis.map(a => (
          <div key={a.id} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-black text-sm">
                  {a.patient.user.prenom[0]}{a.patient.user.nom[0]}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">
                    {a.patient.user.prenom} {a.patient.user.nom[0]}.
                  </p>
                  <p className="text-[9px] font-bold text-slate-400">{fmtShort(a.createdAt)}</p>
                </div>
              </div>
              <StarRating note={a.note} size={13} />
            </div>
            {a.commentaire && (
              <p className="text-sm font-bold text-slate-600 leading-relaxed pl-12">
                "{a.commentaire}"
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TabGalerie ───────────────────────────────────────────────────────────────

export function TabGalerie({
  photos,
  onLightbox,
}: {
  photos: GaleriePhoto[];
  onLightbox: (url: string) => void;
}) {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
            <Images size={16} className="text-slate-400" /> Photos du cabinet
          </h2>
          <span className="text-[10px] font-black text-slate-400 uppercase">
            {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </span>
        </div>
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {photos.map(photo => (
              <div key={photo.id}
                className="relative rounded-2xl overflow-hidden aspect-video bg-slate-100 group cursor-pointer"
                onClick={() => onLightbox(imageUrl(photo.url) ?? '')}>
                <img src={imageUrl(photo.url)} alt="Photo du cabinet"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg transition-all">
                    <ZoomIn size={16} className="text-slate-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl">
            <Images size={36} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-300 font-bold italic text-sm">
              Le médecin n'a pas encore ajouté de photos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SidebarInfo ──────────────────────────────────────────────────────────────

export function SidebarInfo({ medecin, gradient }: {
  medecin:  MedecinProfile;
  gradient: string;
}) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className={`bg-gradient-to-r ${gradient} px-5 py-3`}>
        <p className="text-[9px] font-black text-white/70 uppercase tracking-widest">Informations pratiques</p>
      </div>
      <div className="p-5 space-y-4">
        {medecin.tarif_consultation && (
          <InfoRow icon={<Heart size={15} className="text-emerald-500" />} bg="bg-emerald-50"
            label="Tarif" value={`${medecin.tarif_consultation} TND`} />
        )}
        {medecin.adresseCabinet && (
          <InfoRow icon={<MapPin size={15} className="text-blue-500" />} bg="bg-blue-50"
            label="Adresse" value={medecin.adresseCabinet} sub={medecin.user.ville} />
        )}
        {medecin.user.telephone && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
              <Phone size={15} className="text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Téléphone</p>
              <a href={`tel:${medecin.user.telephone}`}
                className="text-sm font-black text-slate-800 hover:text-emerald-600 transition-colors mt-0.5 block">
                {medecin.user.telephone}
              </a>
            </div>
          </div>
        )}
        {medecin.user.email && (
          <InfoRow icon={<Mail size={15} className="text-purple-500" />} bg="bg-purple-50"
            label="Email" value={medecin.user.email} />
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, bg, label, value, sub }: {
  icon: React.ReactNode; bg: string; label: string; value: string; sub?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0 mt-0.5`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase">{label}</p>
        <p className="text-sm font-bold text-slate-700 mt-0.5 leading-tight">{value}</p>
        {sub && <p className="text-[10px] font-bold text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

export function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}>
      <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
        onClick={onClose}>
        <X size={18} />
      </button>
      <img src={url} alt="Photo agrandie"
        className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
        onClick={e => e.stopPropagation()} />
    </div>
  );
}