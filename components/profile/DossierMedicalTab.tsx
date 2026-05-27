// components/profile/DossierMedicalTab.tsx
// NOTE: renamed from DossierTab to avoid confusion with
//       components/document/DossierTab.tsx (document management)
'use client';

import { Activity, AlertTriangle, Pill, Stethoscope } from 'lucide-react';
import { inputCls, textareaCls, labelCls, GROUPES_SANGUINS, SectionTitle, FieldGroup } from './ui';
import type { DossierForm } from '@/hooks/usePatientProfile';

interface Props {
  dossier:     DossierForm;
  setDossier:  React.Dispatch<React.SetStateAction<DossierForm>>;
  markChanged: () => void;
}

const TEXTAREA_FIELDS: { key: keyof DossierForm; label: string; placeholder: string }[] = [
  { key: 'allergies',               label: 'Allergies connues',        placeholder: 'Ex : Pénicilline, arachides, latex...' },
  { key: 'maladies_chroniques',      label: 'Maladies chroniques',      placeholder: 'Ex : Diabète type 2, hypertension, asthme...' },
  { key: 'antecedents_chirurgicaux', label: 'Antécédents chirurgicaux', placeholder: 'Ex : Appendicectomie 2015, ménisque 2019...' },
];

export default function DossierMedicalTab({ dossier, setDossier, markChanged }: Props) {
  const set = (k: keyof DossierForm, v: string) => {
    setDossier((f: DossierForm) => ({ ...f, [k]: v }));
    markChanged();
  };

  const imc = dossier.poids && dossier.taille
    ? parseFloat(dossier.poids) / Math.pow(parseInt(dossier.taille) / 100, 2)
    : null;

  const imcCat = imc === null ? null
    : imc < 18.5 ? { label: 'Insuffisance pondérale', color: 'text-blue-600',    bg: 'bg-blue-50'    }
    : imc < 25   ? { label: 'Poids normal',            color: 'text-emerald-600', bg: 'bg-emerald-50' }
    : imc < 30   ? { label: 'Surpoids',                color: 'text-amber-600',   bg: 'bg-amber-50'   }
    :              { label: 'Obésité',                  color: 'text-red-600',     bg: 'bg-red-50'     };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm max-w-2xl space-y-8">

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
        <Stethoscope size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs font-bold text-blue-700">
          Ces informations sont partagées avec vos médecins lors des consultations pour assurer un meilleur suivi médical.
        </p>
      </div>

      {/* Biométrie */}
      <div>
        <SectionTitle icon={Activity} title="Biométrie" color="text-blue-600" bg="bg-blue-50" />
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Date de naissance</label>
            <input type="date" value={dossier.dateNaissance}
              onChange={e => set('dateNaissance', e.target.value)} className={inputCls} />
          </div>
          <FieldGroup cols={2}>
            <div>
              <label className={labelCls}>Poids (kg)</label>
              <input type="number" value={dossier.poids} min={20} max={300} step={0.5}
                onChange={e => set('poids', e.target.value)}
                placeholder="Ex : 70" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Taille (cm)</label>
              <input type="number" value={dossier.taille} min={100} max={250}
                onChange={e => set('taille', e.target.value)}
                placeholder="Ex : 175" className={inputCls} />
            </div>
          </FieldGroup>
          <div>
            <label className={labelCls}>Groupe sanguin</label>
            <div className="grid grid-cols-4 gap-2">
              {GROUPES_SANGUINS.map((g: string) => (
                <button key={g} type="button" onClick={() => set('groupeSanguin', g)}
                  className={`py-2.5 rounded-xl text-xs font-black border-2 transition-all ${
                    dossier.groupeSanguin === g
                      ? 'bg-red-500 text-white border-red-500 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:bg-red-50'
                  }`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Antécédents */}
      <div>
        <SectionTitle icon={AlertTriangle} title="Antécédents & Conditions" color="text-amber-600" bg="bg-amber-50" />
        <div className="space-y-4">
          {TEXTAREA_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <textarea rows={3} value={dossier[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder} className={textareaCls} />
            </div>
          ))}
        </div>
      </div>

      {/* Médicaments */}
      <div>
        <SectionTitle icon={Pill} title="Médicaments actuels" color="text-purple-600" bg="bg-purple-50" />
        <textarea rows={4} value={dossier.medicaments_actuels}
          onChange={e => set('medicaments_actuels', e.target.value)}
          placeholder={'Ex : Metformine 500mg — 2×/jour\nAmlodipine 5mg — 1×/jour\n...'}
          className={textareaCls} />
      </div>

      {/* IMC */}
      {imc !== null && imcCat && (
        <div className={`flex justify-between items-center p-4 ${imcCat.bg} border border-slate-100 rounded-2xl`}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">IMC calculé</p>
            <p className={`text-xl font-black ${imcCat.color}`}>{imc.toFixed(1)}</p>
          </div>
          <span className={`text-xs font-black px-4 py-2 rounded-xl ${imcCat.bg} ${imcCat.color} border border-current/20`}>
            {imcCat.label}
          </span>
        </div>
      )}
    </div>
  );
}