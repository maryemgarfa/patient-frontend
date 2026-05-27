// ─── Routes du frontend patient ───────────────────────────────────────────────

export const ROUTES = {
  // Auth
  LOGIN:    '/login',
  REGISTER: '/register',

  // Patient
  DASHBOARD:   '/patient',
  RDV:         '/patient/rdv',
  DOSSIER:     '/patient/dossier',
  ORDONNANCES: '/patient/ordonnances',
  DOCUMENTS:   '/patient/documents',
  SETTINGS:    '/patient/settings',
  SEARCH:      '/patient/search',

  // Dynamiques
  MEDECIN: (id: string) => `/patient/medecin/${id}`,
} as const;