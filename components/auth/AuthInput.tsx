'use client';

// ─── AuthInput ─────────────────────────────────────────────────────────────────

type AuthInputProps = {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

const DEFAULT_INPUT_CLS = `w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500
  focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-700 font-medium`;

export function AuthInput({ label, type, value, onChange, placeholder, className }: AuthInputProps) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={className ?? DEFAULT_INPUT_CLS}
      />
    </div>
  );
}

// ─── AuthPanel (left decorative panel for login) ───────────────────────────────

export function AuthPanel({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="hidden md:flex md:w-1/2 bg-emerald-600 items-center justify-center p-12 text-white">
      <div className="max-w-md text-center">
        <div className="inline-block p-4 bg-white rounded-3xl mb-6 shadow-2xl">
          <span className="text-4xl font-black text-emerald-600 tracking-tighter">AloDocteur</span>
        </div>
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        <p className="text-emerald-50 text-lg opacity-90">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── RegisterPanel (left decorative panel for register) ───────────────────────

export function RegisterPanel() {
  return (
    <div className="hidden lg:flex lg:w-[42%] bg-[#1A1A2E] relative overflow-hidden flex-col justify-between p-14">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-500/10 -translate-y-20 translate-x-20" />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-teal-400/8 translate-y-20 -translate-x-10" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-xl">+</div>
          <span className="text-white font-black text-2xl tracking-tighter">AloDocteur</span>
        </div>
      </div>
      <div className="relative z-10 space-y-8">
        <div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Trouvez votre<br /><span className="text-emerald-400">médecin idéal.</span>
          </h2>
          <p className="text-white/50 text-sm font-semibold leading-relaxed">
            Inscrivez-vous en 30 secondes. Prenez rendez-vous en quelques clics.
          </p>
        </div>
        <div className="space-y-4">
          {[
            { icon: '⚡', title: 'Inscription express',      desc: 'Seulement les infos essentielles'     },
            { icon: '🗓️', title: 'RDV en quelques clics',   desc: 'Trouvez et réservez instantanément'    },
            { icon: '📋', title: 'Dossier médical sécurisé', desc: 'Vos données protégées et accessibles'  },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-base shrink-0">{item.icon}</div>
              <div>
                <p className="text-white text-sm font-bold">{item.title}</p>
                <p className="text-white/40 text-xs font-semibold">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-white/20 text-xs font-semibold">© 2026 AloDocteur — Plateforme médicale tunisienne</p>
      </div>
    </div>
  );
}

// ─── PasswordStrengthBar ───────────────────────────────────────────────────────

export function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  return (
    <div className="flex gap-1 mt-2">
      {checks.map((ok, i) => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${ok ? 'bg-emerald-500' : 'bg-slate-200'}`} />
      ))}
    </div>
  );
}

// ─── PasswordMatchBadge ───────────────────────────────────────────────────────

export function PasswordMatchBadge({ password, confirm }: { password: string; confirm: string }) {
  if (!confirm) return null;
  const match = password === confirm;
  return (
    <div className={`flex items-center gap-1.5 mt-2 px-3 py-2 rounded-xl text-[10px] font-bold ${
      match ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${match ? 'bg-emerald-500' : 'bg-red-400'}`} />
      {match ? 'Mots de passe identiques' : 'Ne correspondent pas'}
    </div>
  );
}