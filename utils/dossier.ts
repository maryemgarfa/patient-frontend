// utils/dossier.ts
import type { Appointment, DocumentCategory } from '@/types/dossier.types';

export const fmtDateLong = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export const fmtDateShort = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR');

export const fmtDateFile = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR').replace(/\//g, '-');

export const getInitials = (prenom = '', nom = '') =>
  `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase();

export const fmtFileSize = (bytes?: number): string => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 ** 2).toFixed(1)} Mo`;
};

export const CATEGORY_META: Record<DocumentCategory, { label: string; color: string; bg: string }> = {
  ORDONNANCE:         { label: 'Ordonnance',         color: 'text-blue-600',    bg: 'bg-blue-50'    },
  ANALYSE_BIOLOGIQUE: { label: 'Analyse biologique', color: 'text-purple-600',  bg: 'bg-purple-50'  },
  IMAGERIE_RADIO:     { label: 'Imagerie / Radio',   color: 'text-amber-600',   bg: 'bg-amber-50'   },
  NOTE_PATIENT:       { label: 'Note / Compte-rendu',color: 'text-emerald-600', bg: 'bg-emerald-50' },
  AUTRE:              { label: 'Autre',               color: 'text-slate-600',   bg: 'bg-slate-100'  },
};

export const STATUT_META: Record<string, { label: string; color: string; dot: string }> = {
  EN_ATTENTE: { label: 'En attente', color: 'text-amber-600',   dot: 'bg-amber-400'   },
  CONFIRME:   { label: 'Confirmé',   color: 'text-blue-600',    dot: 'bg-blue-500'    },
  TERMINE:    { label: 'Terminé',    color: 'text-emerald-600', dot: 'bg-emerald-500' },
  ANNULE:     { label: 'Annulé',     color: 'text-red-500',     dot: 'bg-red-400'     },
};

export const downloadOrdonnance = (
  appointment: Appointment,
  userNom: string,
  userPrenom: string,
) => {
  const { medecin, consultation, date, motif } = appointment;
  const txt = [
    `Date        : ${fmtDateLong(date)}`,
    `Patient     : ${userPrenom} ${userNom}`,
    `Médecin     : Dr. ${medecin?.user?.prenom} ${medecin?.user?.nom}`,
    `Spécialité  : ${medecin?.specialite}`,
    `Motif       : ${motif ?? 'Consultation'}`,
    '',
    '── DIAGNOSTIC ────────────────────────────────',
    consultation?.diagnostic ?? '',
    '',
    '── PRESCRIPTION ──────────────────────────────',
    consultation?.prescription ?? '',
    '',
    '══════════════════════════════════════════════',
    'Document généré via AloDocteur',
  ].join('\n');

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `ordonnance_${fmtDateFile(date)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};