// types/dossier.types.ts

export type TabId = 'dossier' | 'ordonnances' | 'consultations';

export type DocumentVisibility = 'PRIVE' | 'PARTAGE' | 'MEDECIN';
export type CreateurRole       = 'PATIENT' | 'MEDECIN';

export type DocumentCategory =
  | 'ORDONNANCE'
  | 'ANALYSE_BIOLOGIQUE'
  | 'IMAGERIE_RADIO'
  | 'NOTE_PATIENT'
  | 'AUTRE';

export interface PatientDocument {
  id:              string;
  titre:           string;
  url:             string;
  type:            DocumentCategory;
  description?:    string | null;
  fichierNom?:     string | null;
  visibility:      DocumentVisibility;
  createurRole:    CreateurRole;
  createurId:      string;
  patientId:       string;
  consultationId?: string | null;
  createdAt:       string;
  updatedAt:       string;
}

export interface UserProfile {
  id:                        string;
  nom:                       string;
  prenom:                    string;
  email:                     string;
  telephone?:                string;
  dateNaissance?:            string;
  groupeSanguin?:            string;
  allergies?:                string[] | string;
  role:                      'PATIENT' | 'MEDECIN' | 'ADMIN';
  // Infos médicales (depuis patientProfile)
  poids?:                    number;
  taille?:                   number;
  maladies_chroniques?:      string;
  medicaments_actuels?:      string;
  antecedents_chirurgicaux?: string;
}

export interface Medecin {
  id:         string;
  specialite: string;
  user: {
    nom:    string;
    prenom: string;
  };
}

export interface Consultation {
  id:            string;
  diagnostic:    string;
  prescription?: string;
  notes_privees?: string;
  createdAt:     string;
}

export interface Appointment {
  id:            string;
  date:          string;
  motif?:        string;
  statut:        'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'TERMINE';
  medecin?:      Medecin;
  consultation?: Consultation;
}