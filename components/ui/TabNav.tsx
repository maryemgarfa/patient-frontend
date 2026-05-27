// components/ui/TabNav.tsx
'use client';

import { FolderOpen, Pill, Calendar } from 'lucide-react';
import type { TabId } from '@/types/dossier.types';

const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: 'dossier',       label: 'Documents',    Icon: FolderOpen },
  { id: 'ordonnances',   label: 'Ordonnances',  Icon: Pill       },
  { id: 'consultations', label: 'Consultations',Icon: Calendar   },
];

interface TabNavProps {
  active:   TabId;
  counts:   Partial<Record<TabId, number>>;
  onChange: (id: TabId) => void;
}

export function TabNav({ active, counts, onChange }: TabNavProps) {
  return (
    <div className="flex gap-1 bg-slate-100/80 p-1.5 rounded-2xl w-full sm:w-fit">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        const count    = counts[id];
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
              isActive
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={15} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
            <span>{label}</span>
            {count !== undefined && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}