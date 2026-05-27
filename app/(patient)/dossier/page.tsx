// app/(patient)/dossier/page.tsx
'use client';

import { useState } from 'react';
import { useDossier } from '@/hooks/useDossier';
import { DossierTab }      from '@/components/document/DossierTab';
import { OrdonnancesTab }  from '@/components/document/OrdonnancesTab';
import { ConsultationsTab } from '@/components/document/ConsultationsTab';
import { Spinner, ErrorBanner } from '@/components/ui/dossier-ui';
import { FolderOpen, Pill, Calendar, User } from 'lucide-react';
import { getInitials } from '@/utils/dossier';
import type { TabId } from '@/types/dossier.types';

const TABS: { id: TabId; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'dossier',       label: 'Documents',    icon: FolderOpen, desc: 'Fichiers médicaux'      },
  { id: 'ordonnances',   label: 'Ordonnances',  icon: Pill,       desc: 'Prescriptions reçues'   },
  { id: 'consultations', label: 'Consultations',icon: Calendar,   desc: 'Historique des visites' },
];

export default function DossierMedicalPage() {
  const [activeTab, setActiveTab] = useState<TabId>('dossier');
  const { user, appointments, documents, ordonnances, loading, error, reload } = useDossier();

  if (loading) return <Spinner />;

  const counts: Record<TabId, number> = {
    dossier:       documents.length,
    ordonnances:   ordonnances.length,
    consultations: appointments.length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-8 pt-8 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white font-black text-2xl shrink-0">
              {getInitials(user?.prenom, user?.nom)}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{user?.prenom} {user?.nom}</h1>
              <p className="text-emerald-100 text-sm font-bold mt-0.5">Dossier médical personnel</p>
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex border-t border-slate-100">
          {TABS.map(({ id, label, icon: Icon, desc }) => {
            const active = activeTab === id;
            const count  = counts[id];
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center gap-1 py-4 px-2 transition-all relative ${
                  active
                    ? 'text-emerald-600'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
                )}
                <div className="flex items-center gap-1.5">
                  <Icon size={15} />
                  <span className="text-sm font-black">{label}</span>
                  {count > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold hidden sm:block">{desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={reload} />}

      {activeTab === 'dossier'       && <DossierTab       documents={documents} appointments={appointments} onUpdated={reload} />}
      {activeTab === 'ordonnances'   && <OrdonnancesTab   ordonnances={ordonnances} documents={documents} user={user} />}
      {activeTab === 'consultations' && <ConsultationsTab user={user} appointments={appointments} />}
    </div>
  );
}