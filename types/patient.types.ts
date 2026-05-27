// ─── Auth ─────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id:      string;
  nom:     string;
  prenom:  string;
  email:   string;
  role:    string;
  photoProfil?: string;
};

// ─── Patient ──────────────────────────────────────────────────────────────────

export type PatientProfile = {
  cin?:                    string;
  adresse?:                string;
  numero_assurance?:       string;
  allergies?:              string;
  maladies_chroniques?:    string;
  groupeSanguin?:          string;
  poids?:                  number;
  taille?:                 number;
  antecedents_chirurgicaux?: string;
  medicaments_actuels?:    string;
  dateNaissance?:          string;
};

export type PatientUser = {
  id:              string;
  nom:             string;
  prenom:          string;
  email:           string;
  telephone?:      string;
  ville?:          string;
  sexe?:           string;
  photoProfil?:    string;
  patientProfile?: PatientProfile;
};

// ─── Medecin ──────────────────────────────────────────────────────────────────

export type MedecinUser = {
  nom:         string;
  prenom:      string;
  ville?:      string;
  telephone?:  string;
  photoProfil?: string;
};

export type Creneau = {
  id:          string;
  debut:       string;
  fin:         string;
  estReserve:  boolean;
};

export type Disponibilite = {
  id:         string;
  jour:       string;
  heureDebut: string;
  heureFin:   string;
};

export type Absence = {
  id:      string;
  debut:   string;
  fin:     string;
  raison?: string;
};

export type Medecin = {
  id:                  string;
  specialite:          string;
  tarif_consultation?: number;
  duree_consultation?: number;
  adresseCabinet?:     string;
  description?:        string;
  experience_annees?:  number;
  diplome?:            string;
  universite?:         string;
  creneaux?:           Creneau[];
  disponibilites?:     Disponibilite[];
  absences?:           Absence[];
  user:                MedecinUser;
};

// ─── Appointment ──────────────────────────────────────────────────────────────

export type StatutKey = 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'TERMINE';

export type Consultation = {
  id?:           string;
  diagnostic:    string;
  prescription?: string;
  notes_privees?: string;
};

export type Appointment = {
  id:             string;
  date:           string;
  motif?:         string;
  statut:         StatutKey;
  notes?:         string;
  consultation?:  Consultation;
  medecin: {
    id:         string;
    specialite: string;
    user: { nom: string; prenom: string; telephone?: string };
  };
};

// ─── Document ─────────────────────────────────────────────────────────────────

export type TDoc = 'ORDONNANCE' | 'ANALYSE_BIOLOGIQUE' | 'IMAGERIE_RADIO' | 'NOTE_PATIENT' | 'AUTRE';

export type PatientDoc = {
  id:              string;
  titre:           string;
  type:            TDoc;
  description?:    string;
  url:             string;
  fichierNom?:     string;
  createdAt:       string;
  consultationId?: string;
};

// ─── Notification ─────────────────────────────────────────────────────────────

export type Notif = {
  id:         string;
  titre:      string;
  message:    string;
  lu:         boolean;
  type?:      string;
  createdAt:  string;
};

// ─── Forms ────────────────────────────────────────────────────────────────────

export type RegisterForm = {
  prenom:        string;
  nom:           string;
  email:         string;
  password:      string;
  confirm:       string;
  dateNaissance: string;
};

export type LoginForm = {
  email:    string;
  password: string;
  role:     'PATIENT' | 'MEDECIN';
};