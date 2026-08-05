'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import api from '@/lib/api';
import { fetchMe } from '@/services/patient.service';
import type { PatientUser } from '@/types/patient.types';
import ProfileSuccessScreen from './Profilesuccessscreen';

// ─── Field registry ────────────────────────────────────────────────────────────

type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'tel' | 'number' | 'select' | 'textarea';
  placeholder?: string;
  options?: string[];
  source: 'user' | 'patient';
  getValue: (u: PatientUser) => string | null | undefined;
  stepId: string;
  stepTitle: string;
  stepEmoji: string;
};

const FIELD_REGISTRY: FieldDef[] = [
  {
    key: 'telephone', label: 'Quel est votre numéro de téléphone ?',
    type: 'tel', placeholder: '+216 XX XXX XXX', source: 'user',
    getValue: u => u.telephone,
    stepId: 'contact', stepTitle: 'Coordonnées', stepEmoji: '📱',
  },
  {
    key: 'ville', label: 'Dans quelle ville habitez-vous ?',
    type: 'select', source: 'user',
    options: ['Tunis','Sfax','Sousse','Ariana','Ben Arous','Monastir','Nabeul','Bizerte','Gabès','Kairouan','Gafsa','Médenine','Jendouba','Tozeur'],
    getValue: u => u.ville,
    stepId: 'contact', stepTitle: 'Coordonnées', stepEmoji: '📱',
  },
  {
    key: 'adresse', label: 'Quelle est votre adresse ?',
    type: 'text', placeholder: '12 Rue de la Liberté', source: 'patient',
    getValue: u => u.patientProfile?.adresse,
    stepId: 'contact', stepTitle: 'Coordonnées', stepEmoji: '📱',
  },
  {
    key: 'cin', label: 'Quel est votre numéro CIN ?',
    type: 'text', placeholder: '12345678', source: 'patient',
    getValue: u => u.patientProfile?.cin,
    stepId: 'identity', stepTitle: 'Identité', stepEmoji: '🪪',
  },
  {
    key: 'sexe', label: 'Quel est votre sexe ?',
    type: 'select', options: ['MASCULIN', 'FEMININ'], source: 'user',
    getValue: u => u.sexe,
    stepId: 'identity', stepTitle: 'Identité', stepEmoji: '🪪',
  },
  {
    key: 'numero_assurance', label: "Quel est votre numéro d'assurance ?",
    type: 'text', placeholder: 'CNAM-XXXX', source: 'patient',
    getValue: u => u.patientProfile?.numero_assurance,
    stepId: 'identity', stepTitle: 'Identité', stepEmoji: '🪪',
  },
  {
    key: 'groupeSanguin', label: 'Quel est votre groupe sanguin ?',
    type: 'select', options: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], source: 'patient',
    getValue: u => u.patientProfile?.groupeSanguin,
    stepId: 'medical', stepTitle: 'Santé', stepEmoji: '🩺',
  },
  {
    key: 'poids', label: 'Quel est votre poids ? (kg)',
    type: 'number', placeholder: '70', source: 'patient',
    getValue: u => u.patientProfile?.poids ? String(u.patientProfile.poids) : null,
    stepId: 'medical', stepTitle: 'Santé', stepEmoji: '🩺',
  },
  {
    key: 'taille', label: 'Quelle est votre taille ? (cm)',
    type: 'number', placeholder: '175', source: 'patient',
    getValue: u => u.patientProfile?.taille ? String(u.patientProfile.taille) : null,
    stepId: 'medical', stepTitle: 'Santé', stepEmoji: '🩺',
  },
  {
    key: 'allergies', label: 'Avez-vous des allergies connues ?',
    type: 'textarea', placeholder: 'Pénicilline, arachides...', source: 'patient',
    getValue: u => u.patientProfile?.allergies,
    stepId: 'medical', stepTitle: 'Santé', stepEmoji: '🩺',
  },
  {
    key: 'maladies_chroniques', label: 'Avez-vous des maladies chroniques ?',
    type: 'textarea', placeholder: 'Diabète, hypertension...', source: 'patient',
    getValue: u => u.patientProfile?.maladies_chroniques,
    stepId: 'medical', stepTitle: 'Santé', stepEmoji: '🩺',
  },
  {
    key: 'antecedents_chirurgicaux', label: 'Avez-vous des antécédents chirurgicaux ?',
    type: 'textarea', placeholder: 'Appendicectomie 2015...', source: 'patient',
    getValue: u => u.patientProfile?.antecedents_chirurgicaux,
    stepId: 'history', stepTitle: 'Antécédents', stepEmoji: '📜',
  },
  {
    key: 'medicaments_actuels', label: 'Prenez-vous des médicaments actuellement ?',
    type: 'textarea', placeholder: 'Metformine 500mg...', source: 'patient',
    getValue: u => u.patientProfile?.medicaments_actuels,
    stepId: 'history', stepTitle: 'Antécédents', stepEmoji: '📜',
  },
];

function buildPayload(values: Record<string, string>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const f of FIELD_REGISTRY) {
    const val = values[f.key];
    if (!val) continue;
    payload[f.key] = f.type === 'number'
      ? (f.key === 'taille' ? parseInt(val) : parseFloat(val))
      : val;
  }
  return payload;
}

// ─── Main Stepper ─────────────────────────────────────────────────────────────

export default function ProfileCompletionStepper({ onClose }: { onClose: () => void }) {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeFields,   setActiveFields]   = useState<FieldDef[]>([]);
  const [fieldIdx,       setFieldIdx]       = useState(0);
  const [values,         setValues]         = useState<Record<string, string>>({});
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [error,          setError]          = useState('');
  const [animDir,        setAnimDir]        = useState<'in' | 'out'>('in');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // ✅ FIX : onClose est appelé UNE seule fois, peu importe combien de fois
  //    le bouton est cliqué ou le composant re-render
  const hasCalledClose = useRef(false);
  const safeClose = useCallback(() => {
    if (hasCalledClose.current) return;
    hasCalledClose.current = true;
    onClose();
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await fetchMe();
        if (cancelled) return;
        const missing = FIELD_REGISTRY.filter(f => {
          const v = f.getValue(user);
          return !v || String(v).trim() === '';
        });
        if (missing.length === 0) { safeClose(); return; }
        setActiveFields(missing);
      } catch {
        setActiveFields(FIELD_REGISTRY);
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => { cancelled = true; };
  }, [safeClose]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [fieldIdx]);

  const field   = activeFields[fieldIdx];
  const isLast  = fieldIdx === activeFields.length - 1;
  const isFirst = fieldIdx === 0;
  const progress = activeFields.length > 0 ? ((fieldIdx + 1) / activeFields.length) * 100 : 0;

  const setValue = (v: string) => setValues(prev => ({ ...prev, [field.key]: v }));

  const goNext = () => {
    setAnimDir('out');
    setTimeout(() => { setFieldIdx(i => Math.min(i + 1, activeFields.length - 1)); setAnimDir('in'); }, 180);
  };

  const goPrev = () => {
    setAnimDir('out');
    setTimeout(() => { setFieldIdx(i => Math.max(0, i - 1)); setAnimDir('in'); }, 180);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && field?.type !== 'textarea') {
      e.preventDefault();
      isLast ? saveAll() : goNext();
    }
  };

  const saveAll = async () => {
    setError(''); setSaving(true);
    try {
      const payload = buildPayload(values);
      if (Object.keys(payload).length > 0) {
        await api.patch('/patients/profile', payload);
      }
      // ✅ FIX : on nettoie localStorage ICI, avant setSaved
      //    comme ça quand le bouton du success screen appelle safeClose(),
      //    useProfileCompletion ne peut plus remettre show=true
      localStorage.removeItem('showProfileCompletion');
      setSaved(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ── Render states ─────────────────────────────────────────────────────────

  // ✅ FIX : ProfileSuccessScreen reçoit safeClose (protégé contre double-call)
  if (saved) return <ProfileSuccessScreen onClose={safeClose} />;

  if (loadingProfile) return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-[2rem] w-[560px] max-w-full shadow-2xl flex items-center justify-center p-16">
        <span className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!field) return null;

  const inputCls = `w-full px-0 py-3 bg-transparent border-b-2 border-slate-200 focus:border-emerald-500
    text-xl font-semibold text-slate-800 placeholder:text-slate-300 outline-none transition-all duration-200`;

  const renderInput = () => {
    if (field.type === 'select') return (
      <div className="flex flex-wrap gap-2 mt-2">
        {field.options?.map(opt => (
          <button key={opt}
            onClick={() => { setValue(opt); if (isLast) setTimeout(saveAll, 250); else setTimeout(goNext, 250); }}
            className={[
              'px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all',
              values[field.key] === opt
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-slate-50',
            ].join(' ')}
          >{opt}</button>
        ))}
      </div>
    );

    if (field.type === 'textarea') return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        rows={3} value={values[field.key] ?? ''}
        onChange={e => setValue(e.target.value)}
        placeholder={field.placeholder ?? ''}
        className={`${inputCls} resize-none text-base leading-relaxed`}
      />
    );

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={field.type} value={values[field.key] ?? ''}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={field.placeholder ?? ''}
        className={inputCls}
      />
    );
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) safeClose(); }}
    >
      <div className="bg-white rounded-[2rem] w-[560px] max-w-full shadow-2xl flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-8 pt-7 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{field.stepEmoji}</span>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">{field.stepTitle}</span>
          </div>
          <button onClick={safeClose} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="px-8 mb-6">
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] font-semibold text-slate-300 mt-1.5">
            Question {fieldIdx + 1} sur {activeFields.length}
          </p>
        </div>

        <div className="px-8 pb-8 flex-1" style={{
          opacity: animDir === 'in' ? 1 : 0,
          transform: animDir === 'in' ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.18s ease, transform 0.18s ease',
        }}>
          <h2 className="text-xl font-black text-slate-900 mb-1 leading-snug">{field.label}</h2>
          <p className="text-xs text-slate-400 font-medium mb-6">
            {field.type !== 'select' ? 'Appuyez sur Entrée pour continuer' : 'Sélectionnez une option'}
            {' · '}
            <button onClick={isLast ? saveAll : goNext} className="text-emerald-500 hover:underline font-semibold">
              {isLast ? 'Terminer sans répondre →' : 'Passer cette question →'}
            </button>
          </p>
          {renderInput()}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs font-bold text-red-600">⚠ {error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-8 py-5 border-t border-slate-50">
          <button onClick={isFirst ? safeClose : goPrev} className="flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronLeft size={14} />
            {isFirst ? "Ignorer pour l'instant" : 'Précédent'}
          </button>
          {isLast ? (
            <button onClick={saveAll} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-black hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-lg shadow-emerald-100">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sauvegarde...</>
                : <><CheckCircle size={15} /> Terminer</>}
            </button>
          ) : (
            <button onClick={goNext} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-slate-800 transition-all">
              Suivant <ChevronRight size={15} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProfileCompletion() {
  const [show, setShow] = useState(false);
  // ✅ FIX : un ref pour bloquer définitivement tout re-show après fermeture
  //    même si un re-render se produit, ce ref ne change jamais
  const permanentlyClosed = useRef(false);

  useEffect(() => {
    // S'exécute une seule fois au mount
    if (localStorage.getItem('showProfileCompletion') === 'true') {
      setShow(true);
    }
  }, []);

  return {
    showStepper: show,
    openStepper: () => {
      permanentlyClosed.current = false;
      setShow(true);
    },
    closeStepper: () => {
      // ✅ Marque comme fermé définitivement + nettoie tout
      permanentlyClosed.current = true;
      localStorage.removeItem('showProfileCompletion');
      setShow(false);
    },
  };
}