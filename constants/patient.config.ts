import {
  Heart, Brain, Eye, Stethoscope, Baby, Bone,
  Activity, BriefcaseMedical, Ear, Droplet, Wind,
} from 'lucide-react';

export const SPEC_DATA: Record<string, {
  label:  string;
  icon:   React.ElementType;
  color:  string;
  bg:     string;
  border: string;
}> = {
  CARDIOLOGIE:       { label: 'Cardiologie',    icon: Heart,            color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200'    },
  NEUROLOGIE:        { label: 'Neurologie',     icon: Brain,            color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-200' },
  OPHTALMOLOGIE:     { label: 'Ophtalmologie',  icon: Eye,              color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200'   },
  MEDECINE_GENERALE: { label: 'Généraliste',    icon: Stethoscope,      color: 'text-emerald-600',bg: 'bg-emerald-50', border: 'border-emerald-200'},
  PEDIATRIE:         { label: 'Pédiatrie',      icon: Baby,             color: 'text-pink-600',   bg: 'bg-pink-50',    border: 'border-pink-200'   },
  ORTHOPEDIE:        { label: 'Orthopédie',     icon: Bone,             color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200'  },
  DERMATOLOGIE:      { label: 'Dermatologie',   icon: Activity,         color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200' },
  GYNECOLOGIE:       { label: 'Gynécologie',    icon: Heart,            color: 'text-rose-600',   bg: 'bg-rose-50',    border: 'border-rose-200'   },
  DENTISTE:          { label: 'Dentiste',       icon: BriefcaseMedical, color: 'text-cyan-600',   bg: 'bg-cyan-50',    border: 'border-cyan-200'   },
  PSYCHIATRE:        { label: 'Psychiatre',     icon: Brain,            color: 'text-indigo-600', bg: 'bg-indigo-50',  border: 'border-indigo-200' },
  NUTRITIONNISTE:    { label: 'Nutritionniste', icon: Activity,         color: 'text-lime-600',   bg: 'bg-lime-50',    border: 'border-lime-200'   },
  ORL:               { label: 'ORL',            icon: Ear,              color: 'text-teal-600',   bg: 'bg-teal-50',    border: 'border-teal-200'   },
  UROLOGIE:          { label: 'Urologie',       icon: Droplet,          color: 'text-sky-600',    bg: 'bg-sky-50',     border: 'border-sky-200'    },
  PNEUMOLOGIE:       { label: 'Pneumologie',    icon: Wind,             color: 'text-cyan-700',   bg: 'bg-cyan-50',    border: 'border-cyan-300'   },
  GASTROENTEROLOGIE: { label: 'Gastro-entérologie', icon: Activity,     color: 'text-yellow-700', bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  default:           { label: 'Médecin',        icon: Stethoscope,      color: 'text-slate-500',  bg: 'bg-slate-50',   border: 'border-slate-200'  },
};

export const SPEC_GRADIENT: Record<string, string> = {
  CARDIOLOGIE:       'from-red-400 to-rose-500',
  NEUROLOGIE:        'from-purple-400 to-violet-600',
  OPHTALMOLOGIE:     'from-blue-400 to-sky-500',
  MEDECINE_GENERALE: 'from-emerald-400 to-teal-500',
  PEDIATRIE:         'from-pink-400 to-rose-400',
  ORTHOPEDIE:        'from-amber-400 to-orange-500',
  DERMATOLOGIE:      'from-orange-400 to-amber-500',
  GYNECOLOGIE:       'from-rose-400 to-pink-500',
  DENTISTE:          'from-cyan-400 to-blue-400',
  PSYCHIATRE:        'from-indigo-400 to-purple-500',
  NUTRITIONNISTE:    'from-lime-400 to-green-500',
  ORL:               'from-teal-400 to-cyan-500',
  UROLOGIE:          'from-sky-400 to-blue-500',
  PNEUMOLOGIE:       'from-cyan-500 to-teal-600',
  GASTROENTEROLOGIE: 'from-yellow-400 to-amber-500',
  default:           'from-slate-400 to-slate-600',
};

export const STATUT_CONFIG: Record<string, {
  label: string; bg: string; text: string; dot: string; border: string;
}> = {
  EN_ATTENTE: { label: 'En attente', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',   border: 'border-amber-200'   },
  CONFIRME:   { label: 'Confirmé',   bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  ANNULE:     { label: 'Annulé',     bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400',     border: 'border-red-200'     },
  TERMINE:    { label: 'Terminé',    bg: 'bg-slate-100',  text: 'text-slate-500',   dot: 'bg-slate-400',   border: 'border-slate-200'   },
};

export const NOTIF_TYPE_CONFIG: Record<string, { color: string }> = {
  RDV_CONFIRME:      { color: 'text-emerald-600 bg-emerald-50' },
  RDV_ANNULE:        { color: 'text-red-500 bg-red-50'         },
  RDV_RAPPEL:        { color: 'text-amber-600 bg-amber-50'     },
  NOUVEAU_MESSAGE:   { color: 'text-blue-600 bg-blue-50'       },
  VALIDATION_COMPTE: { color: 'text-purple-600 bg-purple-50'   },
};