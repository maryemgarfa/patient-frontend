'use client';

import { useLogin } from '@/hooks/useLogin';
import { AuthInput, AuthPanel } from '@/components/auth/AuthComponents';
import { ErrorBanner } from '@/components/ui/errorBanner';
export default function LoginPage() {
  const { email, setEmail, password, setPassword, loading, error, handleLogin, goRegister } = useLogin();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <AuthPanel
        title="Bienvenue sur votre plateforme santé"
        subtitle="Gérez vos rendez-vous et votre suivi médical en toute simplicité et sécurité."
      />

      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-sm bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">

          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Connexion</h2>
            <p className="text-slate-400 text-sm mt-1 font-medium">Heureux de vous revoir !</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="nom@exemple.com" />
            <AuthInput label="Mot de passe" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

            <ErrorBanner message={error} />

            <button
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg shadow-emerald-200 transition-all active:scale-95 ${
                loading ? 'bg-slate-300' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-8 text-center text-xs">
            <p className="text-slate-500">
              Nouveau ici ?{' '}
              <button onClick={goRegister} className="text-emerald-600 font-bold hover:underline underline-offset-4">
                Créer un compte
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}