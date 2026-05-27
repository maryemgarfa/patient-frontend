// Ce fichier va dans :  components/ui/dossier-ui.tsx
'use client';

import { Search, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function Spinner() {
  return (
    <div className="flex items-center justify-center h-[40vh]">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>
  );
}

interface BadgeProps { label: string; color?: string; bg?: string }
export function Badge({ label, color = 'text-slate-600', bg = 'bg-slate-100' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${color} ${bg}`}>
      {label}
    </span>
  );
}

interface EmptyStateProps { icon: ReactNode; title: string; subtitle?: string; action?: ReactNode }
export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
      <div className="text-slate-200 mb-4">{icon}</div>
      <p className="text-slate-500 font-black text-base">{title}</p>
      {subtitle && <p className="text-slate-400 text-sm font-bold mt-1">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

interface SearchBarProps { value: string; onChange: (v: string) => void; placeholder?: string }
export function SearchBar({ value, onChange, placeholder = 'Rechercher…' }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none w-56 transition-all"
      />
    </div>
  );
}

interface SectionHeaderProps { title: string; subtitle: string; actions?: ReactNode }
export function SectionHeader({ title, subtitle, actions }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h2 className="text-xl font-black text-slate-800">{title}</h2>
        <p className="text-slate-400 text-sm font-bold mt-0.5">{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

interface ErrorBannerProps { message: string; onRetry?: () => void }
export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm">
      <p className="text-red-600 font-bold">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 font-black text-xs rounded-xl transition-all">
          Réessayer
        </button>
      )}
    </div>
  );
}