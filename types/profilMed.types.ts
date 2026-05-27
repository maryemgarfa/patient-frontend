import type { Creneau, Absence, Disponibilite } from '@/hooks/useBookingSlots';

export type GaleriePhoto = { id: string; url: string; createdAt?: string };

export type Avis = {
  id: string;
  note: number;
  commentaire?: string;
  createdAt: string;
  patient: { user: { nom: string; prenom: string } };
};

export type MedecinProfile = {
  id: string;
  specialite: string;
  experience_annees?: number;
  diplome?: string;
  universite?: string;
  description?: string;
  tarif_consultation?: number;
  duree_consultation?: number;
  adresseCabinet?: string;
  statut_validation: string;
  creneaux?: Creneau[];
  galerie?: GaleriePhoto[];
  absences?: Absence[];
  disponibilites?: Disponibilite[];
  user: {
    nom: string;
    prenom: string;
    ville?: string;
    telephone?: string;
    email?: string;
    photoProfil?: string;
    photoCouverture?: string;
  };
  avis?: Avis[];
};

export type BookingMedecin = {
  id: string;
  specialite: string;
  tarif_consultation?: number;
  duree_consultation?: number;
  adresseCabinet?: string;
  creneaux: Creneau[];
  absences: Absence[];
  disponibilites: Disponibilite[];
  user: { nom: string; prenom: string; ville?: string; photoProfil?: string };
};

export type TabKey = 'apropos' | 'avis' | 'galerie';