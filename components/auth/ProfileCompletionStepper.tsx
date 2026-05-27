'use client';

import { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import api from '@/lib/api';
import ProfileSuccessScreen from './Profilesuccessscreen';

// ─── Steps definition ─────────────────────────────────────────────────────────

const PATIENT_STEPS = [
  {
    id: 'contact', title: 'Coordonnées', emoji: '📱', desc: 'Pour vous joindre facilement',
    fields: [
      { key: 'telephone',  label: 'Quel est votre numéro de téléphone ?', type: 'tel',    placeholder: '+216 XX XXX XXX', source: 'user' },
      { key: 'ville',      label: 'Dans quelle ville habitez-vous ?',     type: 'select', source: 'user',
        options: ['Tunis','Sfax','Sousse','Ariana','Ben Arous','Monastir','Nabeul','Bizerte','Gabès','Kairouan','Gafsa','Médenine','Jendouba','Tozeur'] },
      { key: 'adresse',    label: 'Quelle est votre adresse ?',           type: 'text',   placeholder: '12 Rue de la Liberté', source: 'patient' },
    ],
  },
  {
    id: 'identity', title: 'Identité', emoji: '🪪', desc: 'Pour votre dossier officiel',
    fields: [
      { key: 'cin',              label: 'Quel est votre numéro CIN ?',         type: 'text',   placeholder: '12345678',  source: 'patient' },
      { key: 'sexe',             label: 'Quel est votre sexe ?',               type: 'select', source: 'user', options: ['MASCULIN', 'FEMININ'] },
      { key: 'numero_assurance', label: "Quel est votre numéro d'assurance ?", type: 'text',   placeholder: 'CNAM-XXXX', source: 'patient' },
    ],
  },
  {
    id: 'medical', title: 'Santé', emoji: '🩺', desc: 'Informations médicales essentielles',
    fields: [
      { key: 'groupeSanguin',       label: 'Quel est votre groupe sanguin ?',      type: 'select',   source: 'patient', options: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
      { key: 'poids',               label: 'Quel est votre poids ? (kg)',          type: 'number',   placeholder: '70',  source: 'patient' },
      { key: 'taille',              label: 'Quelle est votre taille ? (cm)',       type: 'number',   placeholder: '175', source: 'patient' },
      { key: 'allergies',           label: 'Avez-vous des allergies connues ?',    type: 'textarea', placeholder: 'Pénicilline, arachides...', source: 'patient' },
      { key: 'maladies_chroniques', label: 'Avez-vous des maladies chroniques ?', type: 'textarea', placeholder: 'Diabète, hypertension...', source: 'patient' },
    ],
  },
  {
    id: 'history', title: 'Antécédents', emoji: '📜', desc: 'Historique médical',
    fields: [
      { key: 'antecedents_chirurgicaux', label: 'Avez-vous des antécédents chirurgicaux ?',   type: 'textarea', placeholder: 'Appendicectomie 2015...', source: 'patient' },
      { key: 'medicaments_actuels',      label: 'Prenez-vous des médicaments actuellement ?', type: 'textarea', placeholder: 'Metformine 500mg...', source: 'patient' },
    ],
  },
];

type FlatField = {
  key: string; label: string; type: string;
  placeholder?: string; source: string; options?: string[];
  stepId: string; stepTitle: string; stepEmoji: string;
};

const ALL_FIELDS: FlatField[] = PATIENT_STEPS.flatMap(s =>
  s.fields.map(f => ({ ...f, stepId: s.id, stepTitle: s.title, stepEmoji: s.emoji }))
);

// ─── Main Stepper Popup ───────────────────────────────────────────────────────

export default function ProfileCompletionStepper({
  onClose,
}: { onClose: () => void }) {
  const [fieldIdx, setFieldIdx] = useState(0);
  const [values,   setValues]   = useState<Record<string, string>>({});
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');
  const [animDir,  setAnimDir]  = useState<'in' | 'out'>('in');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null);

  const field    = ALL_FIELDS[fieldIdx];
  const isLast   = fieldIdx === ALL_FIELDS.length - 1;
  const isFirst  = fieldIdx === 0;
  const progress = ((fieldIdx + 1) / ALL_FIELDS.length) * 100;

  const setValue = (v: string) => setValues(p => ({ ...p, [field.key]: v }));

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [fieldIdx]);

  const goNext = () => {
    setAnimDir('out');
    setTimeout(() => {
      setFieldIdx(i => {
        const next = i + 1;
        return next < ALL_FIELDS.length ? next : i;
      });
      setAnimDir('in');
    }, 180);
  };

  const goPrev = () => {
    setAnimDir('out');
    setTimeout(() => { setFieldIdx(i => Math.max(0, i - 1)); setAnimDir('in'); }, 180);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && field.type !== 'textarea') {
      e.preventDefault();
      isLast ? saveAll() : goNext();
    }
  };

  const saveAll = async () => {
    setError(''); setSaving(true);
    try {
      for (const step of PATIENT_STEPS) {
        const userPayload:    Record<string, unknown> = {};
        const patientPayload: Record<string, unknown> = {};
        for (const f of step.fields) {
          const val = values[f.key];
          if (!val) continue;
          if (f.source === 'user')    userPayload[f.key]    = val;
          if (f.source === 'patient') patientPayload[f.key] = val;
        }
        const allPayload = { ...userPayload, ...patientPayload };
        if (Object.keys(allPayload).length > 0) await api.patch('/patients/profile', allPayload);
      }
      // Remove BEFORE setSaved — prevents parent re-mount during success screen
      localStorage.removeItem('showProfileCompletion');
      setSaved(true);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    localStorage.removeItem('showProfileCompletion');
    onClose();
  };

  // ── Success screen ────────────────────────────────────────────────────────
  // onClose is safe here: localStorage already cleared above
  if (saved) return <ProfileSuccessScreen onClose={onClose} />;

  // ── Input renderer ────────────────────────────────────────────────────────
  const inputCls = `w-full px-0 py-3 bg-transparent border-b-2 border-slate-200 focus:border-emerald-500
    text-xl font-semibold text-slate-800 placeholder:text-slate-300 outline-none transition-all duration-200`;

  const renderInput = () => {
    if (field.type === 'select') return (
      <div className="flex flex-wrap gap-2 mt-2">
        {field.options?.map(opt => (
          <button
            key={opt}
            onClick={() => {
              setValue(opt);
              if (isLast) setTimeout(saveAll, 250);
              else setTimeout(goNext, 250);
            }}
            className={[
              'px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all',
              values[field.key] === opt
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-slate-50',
            ].join(' ')}
          >
            {opt}
          </button>
        ))}
      </div>
    );

    if (field.type === 'textarea') return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        rows={3}
        value={values[field.key] ?? ''}
        onChange={e => setValue(e.target.value)}
        placeholder={field.placeholder ?? ''}
        className={`${inputCls} resize-none border-b-2 border-slate-200 focus:border-emerald-500 text-base leading-relaxed`}
      />
    );

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={field.type}
        value={values[field.key] ?? ''}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={field.placeholder ?? ''}
        className={inputCls}
      />
    );
  };

  // ── Main modal ────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) handleSkip(); }}
    >
      <div className="bg-white rounded-[2rem] w-[560px] max-w-full shadow-2xl flex flex-col overflow-hidden">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-8 pt-7 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{field.stepEmoji}</span>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">{field.stepTitle}</span>
          </div>
          <button
            onClick={handleSkip}
            className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Progress bar ── */}
        <div className="px-8 mb-6">
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] font-semibold text-slate-300 mt-1.5">
            Question {fieldIdx + 1} sur {ALL_FIELDS.length}
          </p>
        </div>

        {/* ── Question ── */}
        <div
          className="px-8 pb-8 flex-1"
          style={{
            opacity: animDir === 'in' ? 1 : 0,
            transform: animDir === 'in' ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
          }}
        >
          <h2 className="text-xl font-black text-slate-900 mb-1 leading-snug">
            {field.label}
          </h2>
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

        {/* ── Footer nav ── */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-slate-50">
          <button
            onClick={isFirst ? handleSkip : goPrev}
            className="flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronLeft size={14} />
            {isFirst ? "Ignorer pour l'instant" : 'Précédent'}
          </button>

          {isLast ? (
            <button
              onClick={saveAll}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-black hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-lg shadow-emerald-100"
            >
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sauvegarde...</>
                : <><CheckCircle size={15} /> Terminer</>
              }
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-slate-800 transition-all"
            >
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
  const [show,      setShow]      = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only show if never dismissed in this session
    if (!dismissed && localStorage.getItem('showProfileCompletion') === 'true') {
      setShow(true);
    }
  }, [dismissed]);

  return {
    showStepper:  show,
    openStepper:  () => { setDismissed(false); setShow(true); },
    closeStepper: () => {
      setDismissed(true);  // blocks any re-show for the rest of the session
      setShow(false);
      localStorage.removeItem('showProfileCompletion');
    },
  };
}