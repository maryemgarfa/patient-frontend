// components/profile/AssuranceTab.tsx
'use client';

import { BadgeCheck, Shield } from 'lucide-react';
import { inputCls, textareaCls, labelCls, SectionTitle } from './ui';
import type { AssuranceForm } from '@/hooks/usePatientProfile';

interface Props {
  assurance:    AssuranceForm;
  setAssurance: React.Dispatch<React.SetStateAction<AssuranceForm>>;
  markChanged:  () => void;
}

export default function AssuranceTab({ assurance, setAssurance, markChanged }: Props) {
  const set = (k: keyof AssuranceForm, v: string) => {
    setAssurance((f: AssuranceForm) => ({ ...f, [k]: v }));
    markChanged();
  };

  const summary = [
    { l: 'CIN',          v: assurance.cin              || '—' },
    { l: 'N° Assurance', v: assurance.numero_assurance || '—' },
    { l: 'Adresse',      v: assurance.adresse          || '—' },
  ];

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm max-w-2xl space-y-8">

      <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <Shield size={16} className="text-slate-500 shrink-0 mt-0.5" />
        <p className="text-xs font-bold text-slate-600">
          Ces informations administratives permettent aux médecins de vérifier votre identité et votre couverture sociale.
        </p>
      </div>

      <div>
        <SectionTitle icon={BadgeCheck} title="Pièce d'identité" color="text-indigo-600" bg="bg-indigo-50" />
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Numéro CIN</label>
            <input type="text" value={assurance.cin}
              onChange={e => set('cin', e.target.value)}
              placeholder="Ex : 12345678" maxLength={8} className={inputCls} />
            <p className="text-[10px] font-bold text-slate-400 mt-1.5">8 chiffres — Carte d'identité nationale tunisienne</p>
          </div>
          <div>
            <label className={labelCls}>Adresse complète</label>
            <textarea rows={3} value={assurance.adresse}
              onChange={e => set('adresse', e.target.value)}
              placeholder="Ex : 10 Rue de la Liberté, Tunis 1001"
              className={textareaCls} />
          </div>
        </div>
      </div>

      <div>
        <SectionTitle icon={Shield} title="Assurance maladie" color="text-teal-600" bg="bg-teal-50" />
        <div>
          <label className={labelCls}>Numéro d'assurance / CNAM</label>
          <input type="text" value={assurance.numero_assurance}
            onChange={e => set('numero_assurance', e.target.value)}
            placeholder="Ex : CNAM-123456789" className={inputCls} />
          <p className="text-[10px] font-bold text-slate-400 mt-1.5">Caisse Nationale d'Assurance Maladie — optionnel</p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Récapitulatif</p>
        </div>
        {summary.map(({ l, v }) => (
          <div key={l} className="flex justify-between px-5 py-3 border-b border-slate-100 last:border-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{l}</span>
            <span className={`text-sm font-black text-right max-w-[60%] ${v === '—' ? 'text-slate-300' : 'text-slate-700'}`}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}