// Convertit le libellé français renvoyé par le chatbot IA
// vers la clé d'enum MedicalSpecialty utilisée partout dans le frontend/DB.

const MAPPING_CHATBOT_VERS_ENUM: Record<string, string> = {
  "cardiologie":          "CARDIOLOGIE",
  "neurologie":           "NEUROLOGIE",
  "ophtalmologie":        "OPHTALMOLOGIE",
  "médecine générale":    "MEDECINE_GENERALE",
  "medecine generale":    "MEDECINE_GENERALE",
  "pédiatrie":            "PEDIATRIE",
  "orthopédie":           "ORTHOPEDIE",
  "dermatologie":         "DERMATOLOGIE",
  "gynécologie":          "GYNECOLOGIE",
  "dentiste":             "DENTISTE",
  "psychiatre":           "PSYCHIATRE",
  "nutritionniste":       "NUTRITIONNISTE",
  "orl":                  "ORL",
  "urologie":             "UROLOGIE",
  "pneumologie":          "PNEUMOLOGIE",
  "gastro-entérologie":   "GASTROENTEROLOGIE",
  "gastro-enterologie":   "GASTROENTEROLOGIE",
  "gastro entérologie":   "GASTROENTEROLOGIE",
};

/**
 * Convertit un libellé de spécialité (venant du chatbot IA, en français libre)
 * vers la clé d'enum MedicalSpecialty. Retourne null si aucune correspondance
 * n'est trouvée (ex: "Urgences / SAMU").
 */
export function specialiteVersEnum(libelleFr: string): string | null {
  const normalise = libelleFr.toLowerCase().trim();
  return MAPPING_CHATBOT_VERS_ENUM[normalise] ?? null;
}