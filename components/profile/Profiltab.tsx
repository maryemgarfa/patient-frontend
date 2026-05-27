// components/profile/ProfilTab.tsx
'use client';

import { User } from 'lucide-react';
import { inputCls, labelCls, VILLES, SectionTitle, FieldGroup } from './ui';
import type { ProfilForm } from '@/hooks/usePatientProfile';

interface Props {
  profil:      ProfilForm;
  setProfil:   React.Dispatch<React.SetStateAction<ProfilForm>>;
  markChanged: () => void;
}

export default function ProfilTab({ profil, setProfil, markChanged }: Props) {
  const set = (k: keyof ProfilForm, v: string) => {
    setProfil((f: ProfilForm) => ({ ...f, [k]: v }));
    markChanged();
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm max-w-2xl space-y-7">

      {/* Avatar */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 font-black text-xl shrink-0">
          {profil.prenom[0]}{profil.nom[0]}
        </div>
        <div>
          <p className="font-black text-slate-800">{profil.prenom} {profil.nom}</p>
          <p className="text-xs font-bold text-slate-400">{profil.email}</p>
          <p className="text-[10px] font-bold text-emerald-600 mt-0.5 uppercase">Patient</p>
        </div>
      </div>

      {/* Identité */}
      <div>
        <SectionTitle icon={User} title="Identité" />
        <div className="space-y-4">
          <FieldGroup cols={2}>
            <div>
              <label className={labelCls}>Prénom <span className="text-red-400">*</span></label>
              <input type="text" value={profil.prenom}
                onChange={e => set('prenom', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Nom <span className="text-red-400">*</span></label>
              <input type="text" value={profil.nom}
                onChange={e => set('nom', e.target.value)} className={inputCls} />
            </div>
          </FieldGroup>

          <div>
            <label className={labelCls}>Email <span className="text-red-400">*</span></label>
            <input type="email" value={profil.email}
              onChange={e => set('email', e.target.value)} className={inputCls} />
          </div>

          <FieldGroup cols={2}>
            <div>
              <label className={labelCls}>Téléphone</label>
              <input type="tel" value={profil.telephone}
                onChange={e => set('telephone', e.target.value)}
                placeholder="+216 XX XXX XXX" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Sexe</label>
              <select value={profil.sexe} onChange={e => set('sexe', e.target.value)}
                className={inputCls}>
                <option value="MASCULIN">Masculin</option>
                <option value="FEMININ">Féminin</option>
              </select>
            </div>
          </FieldGroup>

          <div>
            <label className={labelCls}>Ville</label>
            <select value={profil.ville} onChange={e => set('ville', e.target.value)}
              className={inputCls}>
              <option value="">-- Sélectionner --</option>
              {VILLES.map((v: string) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}