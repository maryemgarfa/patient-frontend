// ─── Shared UI primitives ─────────────────────────────────────────────────────
// Used across all profile tab components

export const inputCls =
  'w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold ' +
  'text-slate-700 focus:ring-2 focus:ring-emerald-400 outline-none transition-all ' +
  'placeholder:font-normal placeholder:text-slate-300';

export const textareaCls = inputCls + ' resize-none';

export const labelCls =
  'text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2';

export const VILLES = [
  'Tunis', 'Sfax', 'Sousse', 'Ariana', 'Ben Arous', 'Monastir',
  'Nabeul', 'Bizerte', 'Gabès', 'Kairouan', 'Gafsa', 'Médenine', 'Jendouba', 'Tozeur',
];

export const GROUPES_SANGUINS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ─── SectionTitle ─────────────────────────────────────────────────────────────
export function SectionTitle({
  icon: Icon, title,
  color = 'text-emerald-600',
  bg    = 'bg-emerald-50',
}: {
  icon: React.ElementType; title: string; color?: string; bg?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-8 h-8 ${bg} ${color} rounded-xl flex items-center justify-center`}>
        <Icon size={15} />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
    </div>
  );
}

// ─── FieldGroup ───────────────────────────────────────────────────────────────
export function FieldGroup({ children, cols = 1 }: { children: React.ReactNode; cols?: 1 | 2 }) {
  return (
    <div className={cols === 2 ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
      {children}
    </div>
  );
}