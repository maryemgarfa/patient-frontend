// hooks/usePatientProfile.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchMe,
  updateProfile,
  updateMedicalRecord,
  changePassword,
} from '@/services/patient.service';
import type { PatientUser } from '@/types/patient.types';

// ─── Form state shapes (exported for tab components) ─────────────────────────

export type ProfilForm = {
  prenom: string; nom: string; email: string;
  telephone: string; ville: string; sexe: string;
};

export type DossierForm = {
  dateNaissance: string; groupeSanguin: string;
  poids: string; taille: string;
  allergies: string; maladies_chroniques: string;
  antecedents_chirurgicaux: string; medicaments_actuels: string;
};

export type AssuranceForm = {
  cin: string; numero_assurance: string; adresse: string;
};

export type PwForm = { current: string; next: string; confirm: string };

// ─── Completion helper ────────────────────────────────────────────────────────

export function calcCompletion(u: PatientUser | null) {
  const p = u?.patientProfile;
  const checks = [
    !!u?.prenom, !!u?.nom, !!u?.email, !!u?.telephone,
    !!u?.ville, !!u?.sexe,
    !!p?.dateNaissance, !!p?.adresse, !!p?.cin,
    !!p?.groupeSanguin, !!p?.poids, !!p?.taille, !!p?.numero_assurance,
  ];
  const done = checks.filter(Boolean).length;
  return { percent: Math.round((done / checks.length) * 100), done, total: checks.length };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePatientProfile() {
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast,      setToast]      = useState('');
  const [toastType,  setToastType]  = useState<'success' | 'error'>('success');
  const [userData,   setUserData]   = useState<PatientUser | null>(null);

  const [profil, setProfil] = useState<ProfilForm>({
    prenom: '', nom: '', email: '', telephone: '', ville: '', sexe: 'MASCULIN',
  });
  const [dossierMedical, setDossierMedical] = useState<DossierForm>({
    dateNaissance: '', groupeSanguin: '', poids: '', taille: '',
    allergies: '', maladies_chroniques: '', antecedents_chirurgicaux: '', medicaments_actuels: '',
  });
  const [assurance, setAssurance] = useState<AssuranceForm>({
    cin: '', numero_assurance: '', adresse: '',
  });
  const [pwForm,  setPwForm]  = useState<PwForm>({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 3000);
  };

  const markChanged = () => setHasChanges(true);

  const loadUser = useCallback(async () => {
    const u = await fetchMe();          // GET /patients/me
    setUserData(u);
    const p = u.patientProfile ?? {};

    setProfil({
      prenom: u.prenom ?? '', nom: u.nom ?? '', email: u.email ?? '',
      telephone: u.telephone ?? '', ville: u.ville ?? '', sexe: u.sexe ?? 'MASCULIN',
    });
    setDossierMedical({
      dateNaissance:            p.dateNaissance
        ? new Date(p.dateNaissance).toISOString().split('T')[0] : '',
      groupeSanguin:            p.groupeSanguin            ?? '',
      poids:                    p.poids  ? String(p.poids)  : '',
      taille:                   p.taille ? String(p.taille) : '',
      allergies:                p.allergies                ?? '',
      maladies_chroniques:      p.maladies_chroniques      ?? '',
      antecedents_chirurgicaux: p.antecedents_chirurgicaux ?? '',
      medicaments_actuels:      p.medicaments_actuels      ?? '',
    });
    setAssurance({
      cin:              p.cin              ?? '',
      numero_assurance: p.numero_assurance ?? '',
      adresse:          p.adresse          ?? '',
    });
  }, []);

  useEffect(() => {
    loadUser().catch(console.error).finally(() => setLoading(false));
  }, [loadUser]);

  const saveProfil = async () => {
    setSaving(true);
    try {
      await updateProfile(profil);      // PATCH /patients/profile
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, ...profil }));
      setHasChanges(false);
      await loadUser();
      showToast('Profil mis à jour avec succès');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || 'Erreur mise à jour', 'error');
    } finally { setSaving(false); }
  };

  const saveMedical = async (payload: Record<string, unknown>, successMsg: string) => {
    setSaving(true);
    try {
      const userId = userData?.id ?? JSON.parse(localStorage.getItem('user') || '{}').id as string;
      await updateMedicalRecord(userId, payload);  // PATCH /users/patients/:id/medical
      setHasChanges(false);
      await loadUser();
      showToast(successMsg);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || 'Erreur', 'error');
    } finally { setSaving(false); }
  };

  const saveDossier = () => saveMedical({
    dateNaissance:            dossierMedical.dateNaissance            || undefined,
    groupeSanguin:            dossierMedical.groupeSanguin            || undefined,
    poids:                    dossierMedical.poids  ? parseFloat(dossierMedical.poids)  : undefined,
    taille:                   dossierMedical.taille ? parseInt(dossierMedical.taille)   : undefined,
    allergies:                dossierMedical.allergies                || undefined,
    maladies_chroniques:      dossierMedical.maladies_chroniques      || undefined,
    antecedents_chirurgicaux: dossierMedical.antecedents_chirurgicaux || undefined,
    medicaments_actuels:      dossierMedical.medicaments_actuels      || undefined,
  }, 'Dossier médical mis à jour');

  const saveAssurance = () => saveMedical({
    cin:              assurance.cin              || undefined,
    numero_assurance: assurance.numero_assurance || undefined,
    adresse:          assurance.adresse          || undefined,
  }, 'Informations administratives mises à jour');

  const savePassword = async () => {
    setPwError('');
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) { setPwError('Tous les champs sont obligatoires'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Les mots de passe ne correspondent pas'); return; }
    if (pwForm.next.length < 8) { setPwError('Minimum 8 caractères'); return; }
    setSaving(true);
    try {
      await changePassword(pwForm.current, pwForm.next);  // PATCH /patients/change-password
      setPwForm({ current: '', next: '', confirm: '' });
      showToast('Mot de passe modifié avec succès');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setPwError(err.response?.data?.message || 'Mot de passe actuel incorrect');
    } finally { setSaving(false); }
  };

  return {
    loading, saving, hasChanges, toast, toastType, userData,
    profil, dossierMedical, assurance, pwForm, pwError,
    setProfil, setDossierMedical, setAssurance, setPwForm, markChanged,
    saveProfil, saveDossier, saveAssurance, savePassword,
  };
}