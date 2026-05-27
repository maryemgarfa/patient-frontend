// ─── Types UI spécifiques au frontend patient ────────────────────────────────
// Les entités métier viennent de @shared

// ─── Profil utilisateur stocké en localStorage ───────────────────────────────
export type StoredUser = {
  id:          string;
  nom:         string;
  prenom:      string;
  email:       string;
  role:        string;
  telephone?:  string;
  ville?:      string;
  sexe?:       string;
  photoProfil?: string;
};

// ─── Formulaire de mise à jour du profil patient ─────────────────────────────
export type ProfileForm = {
  prenom:      string;
  nom:         string;
  email:       string;
  telephone:   string;
  ville:       string;
  sexe:        string;
};

// ─── Formulaire de changement de mot de passe ────────────────────────────────
export type PwForm = {
  current: string;
  next:    string;
  confirm: string;
};

// ─── Formulaire de complétion de profil médical ──────────────────────────────
export type MedicalProfileForm = {
  dateNaissance:           string;
  groupeSanguin:           string;
  allergies:               string;
  maladies_chroniques:     string;
  antecedents_chirurgicaux: string;
  medicaments_actuels:     string;
  poids:                   string;
  taille:                  string;
  cin:                     string;
  numero_assurance:        string;
};

// ─── Médecin public (pour recherche et booking) ───────────────────────────────
export type MedecinPublic = {
  id:                  string;
  specialite:          string;
  tarif_consultation?: number;
  experience_annees?:  number;
  adresseCabinet?:     string;
  description?:        string;
  duree_consultation?: number;
  user: {
    nom:          string;
    prenom:       string;
    ville?:       string;
    photoProfil?: string;
  };
};

// ─── Rendez-vous côté patient ─────────────────────────────────────────────────
export type PatientAppointment = {
  id:     string;
  date:   string;
  motif?: string;
  statut: import('@shared/types/appointment.types').StatutKey;
  medecin: {
    id:        string;
    specialite: string;
    user: { nom: string; prenom: string };
  };
  consultation?: import('@shared/types/appointment.types').Consultation;
};

// ─── Document médical côté patient ───────────────────────────────────────────
export type PatientDocument = {
  id:              string;
  titre:           string;
  type:            import('@shared/types/appointment.types').DocType;
  description?:    string;
  url:             string;
  fichierNom?:     string;
  createdAt:       string;
  consultationId?: string;
};

// ─── Notification ─────────────────────────────────────────────────────────────
export type Notif = {
  id:        string;
  titre:     string;
  message:   string;
  lu:        boolean;
  type?:     string;
  createdAt: string;
};