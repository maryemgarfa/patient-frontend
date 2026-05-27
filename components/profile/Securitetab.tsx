// components/profile/SecuriteTab.tsx
'use client';

import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { inputCls, labelCls, SectionTitle } from './ui';
import type { PwForm } from '@/hooks/usePatientProfile';

interface Props {
  pwForm:       PwForm;
  setPwForm:    React.Dispatch<React.SetStateAction<PwForm>>;
  pwError:      string;
  saving:       boolean;
  savePassword: () => void;
}

// ← typed key as keyof PwForm to fix TS7053 indexing errors
type PwField = { label: string; key: keyof PwForm };

const PW_FIELDS: PwField[] = [
  { label: 'Mot de passe actuel',     key: 'current' },
  { label: 'Nouveau mot de passe',     key: 'next'    },
  { label: 'Confirmer le nouveau MDP', key: 'confirm' },
];

type ShowPw = Record<keyof PwForm, boolean>;

export default function SecuriteTab({ pwForm, setPwForm, pwError, saving, savePassword }: Props) {
  const [showPw, setShowPw] = useState<ShowPw>({ current: false, next: false, confirm: false });

  const checks = [
    { ok: pwForm.next.length >= 8,           txt: '8 caractères minimum' },
    { ok: /[A-Z]/.test(pwForm.next),         txt: 'Une majuscule'        },
    { ok: /[0-9]/.test(pwForm.next),         txt: 'Un chiffre'           },
    { ok: /[^A-Za-z0-9]/.test(pwForm.next), txt: 'Un caractère spécial' },
  ];

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm max-w-lg space-y-6">

      <SectionTitle icon={Lock} title="Changer le mot de passe" color="text-slate-600" bg="bg-slate-100" />

      {PW_FIELDS.map(({ label, key }) => (
        // key is keyof PwForm (string literal union) — safe to use as React key
        <div key={key}>
          <label className={labelCls}>{label}</label>
          <div className="relative">
            <input
              type={showPw[key] ? 'text' : 'password'}
              value={pwForm[key]}
              onChange={e => setPwForm((f: PwForm) => ({ ...f, [key]: e.target.value }))}
              className={inputCls + ' pr-12'} />
            <button type="button"
              onClick={() => setShowPw((s: ShowPw) => ({ ...s, [key]: !s[key] }))}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPw[key] ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      ))}

      {pwError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs font-bold text-red-600">{pwError}</p>
        </div>
      )}

      {pwForm.next && (
        <div className="space-y-2">
          <div className="flex gap-1">
            {checks.map(({ ok }, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${ok ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {checks.map(({ ok, txt }) => (
              <div key={txt} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className={`text-[10px] font-bold ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>{txt}</span>
              </div>
            ))}
          </div>
          {pwForm.confirm && (
            <div className={`flex items-center gap-2 p-2.5 rounded-xl mt-2 ${pwForm.next === pwForm.confirm ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <div className={`w-2 h-2 rounded-full ${pwForm.next === pwForm.confirm ? 'bg-emerald-500' : 'bg-red-400'}`} />
              <p className={`text-[10px] font-black ${pwForm.next === pwForm.confirm ? 'text-emerald-700' : 'text-red-600'}`}>
                {pwForm.next === pwForm.confirm ? 'Mots de passe identiques' : 'Ne correspondent pas'}
              </p>
            </div>
          )}
        </div>
      )}

      <button onClick={savePassword}
        disabled={saving || !pwForm.current || !pwForm.next || !pwForm.confirm}
        className="w-full py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 disabled:opacity-50 transition-all">
        {saving ? 'Modification...' : 'Modifier le mot de passe'}
      </button>
    </div>
  );
}