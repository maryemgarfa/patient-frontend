// app/(patient)/dossier/page.tsx
'use client';

import { useState } from 'react';
import { CheckCircle, Heart, Lock, Save, Shield, User } from 'lucide-react';

import { usePatientProfile, calcCompletion } from '@/hooks/usePatientProfile';
import ProfilTab        from '@/components/profile/Profiltab';
import DossierMedicalTab from '@/components/profile/DossierMedicalTab';
import AssuranceTab     from '@/components/profile/Assurancetab';
import SecuriteTab      from '@/components/profile/Securitetab';

type TabKey = 'profil' | 'dossier' | 'securite' | 'assurance';

const TABS: { key: TabKey; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'profil',    label: 'Mon profil',      icon: User,   desc: 'Identité & contact'  },
  { key: 'dossier',   label: 'Dossier médical', icon: Heart,  desc: 'Santé & antécédents' },
  { key: 'assurance', label: 'Assurance & CIN', icon: Shield, desc: 'Administratif'        },
  { key: 'securite',  label: 'Sécurité',        icon: Lock,   desc: 'Mot de passe'         },
];

export default function PatientSettings() {
  const [tab, setTab] = useState<TabKey>('profil');

  const {
    loading, saving, hasChanges, toast, toastType, userData,
    profil, dossierMedical, assurance, pwForm, pwError,
    setProfil, setDossierMedical, setAssurance, setPwForm, markChanged,
    saveProfil, saveDossier, saveAssurance, savePassword,
  } = usePatientProfile();

  if (loading) return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  const { percent } = calcCompletion(userData);

  const handleSave = () => {
    if (tab === 'profil')    saveProfil();
    if (tab === 'dossier')   saveDossier();
    if (tab === 'assurance') saveAssurance();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16">

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Paramètres</h1>
          <p className="text-slate-400 text-sm font-bold">Gérez toutes vos informations personnelles</p>
        </div>
        {tab !== 'securite' && (
          <button onClick={handleSave} disabled={saving}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-60 ${
              hasChanges
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700'
                : 'bg-slate-100 text-slate-400'
            }`}>
            <Save size={15} /> {saving ? 'Enregistrement...' : 'Sauvegarder'}
            {hasChanges && <span className="w-2 h-2 bg-white rounded-full animate-pulse" />}
          </button>
        )}
      </div>

      {/* Completion Banner */}
      <div className={`p-5 rounded-[2rem] border flex items-center gap-5 ${
        percent === 100 ? 'bg-emerald-50 border-emerald-200'
        : percent >= 60 ? 'bg-amber-50 border-amber-200'
        :                 'bg-red-50 border-red-200'
      }`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 ${
          percent === 100 ? 'bg-emerald-100 text-emerald-700'
          : percent >= 60 ? 'bg-amber-100 text-amber-700'
          :                 'bg-red-100 text-red-600'
        }`}>
          {percent === 100 ? '✓' : `${percent}%`}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-black text-sm ${
            percent === 100 ? 'text-emerald-800' : percent >= 60 ? 'text-amber-800' : 'text-red-700'
          }`}>
            {percent === 100 ? 'Profil complet !' : percent >= 60 ? 'Profil presque complet' : 'Profil incomplet'}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${
                percent === 100 ? 'bg-emerald-500' : percent >= 60 ? 'bg-amber-400' : 'bg-red-400'
              }`} style={{ width: `${percent}%` }} />
            </div>
            <span className={`text-[10px] font-black shrink-0 ${
              percent === 100 ? 'text-emerald-600' : percent >= 60 ? 'text-amber-600' : 'text-red-500'
            }`}>{percent}% complété</span>
          </div>
          {percent < 100 && (
            <p className={`text-[10px] font-bold mt-1 ${percent >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
              Complétez votre profil pour une meilleure expérience médicale.
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TABS.map(t => {
          const Icon     = t.icon;
          const isActive = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex flex-col items-start gap-2 p-4 rounded-[1.5rem] border-2 text-left transition-all ${
                isActive
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100'
                  : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'
              }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
              </div>
              <div>
                <p className={`text-xs font-black ${isActive ? 'text-white' : 'text-slate-700'}`}>{t.label}</p>
                <p className={`text-[9px] font-bold ${isActive ? 'text-white/70' : 'text-slate-400'}`}>{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'profil'    && <ProfilTab         profil={profil}            setProfil={setProfil}             markChanged={markChanged} />}
      {tab === 'dossier'   && <DossierMedicalTab  dossier={dossierMedical}   setDossier={setDossierMedical}    markChanged={markChanged} />}
      {tab === 'assurance' && <AssuranceTab       assurance={assurance}      setAssurance={setAssurance}       markChanged={markChanged} />}
      {tab === 'securite'  && <SecuriteTab        pwForm={pwForm}            setPwForm={setPwForm}
                                                  pwError={pwError}          saving={saving}
                                                  savePassword={savePassword} />}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl
          animate-in slide-in-from-bottom-2 duration-300 text-sm font-bold ${
          toastType === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
        }`}>
          <CheckCircle size={16} className={toastType === 'error' ? 'text-white' : 'text-emerald-400'} />
          {toast}
        </div>
      )}
    </div>
  );
}