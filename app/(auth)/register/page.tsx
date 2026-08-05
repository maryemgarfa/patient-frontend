'use client';

import { useRegister } from '@/hooks/useRegister';
import { AuthInput, PasswordStrengthBar, PasswordMatchBadge, RegisterPanel } from '@/components/auth/AuthComponents';
import { ErrorBanner } from '@/components/ui/errorBanner';
import DateNaissancePicker from '@/components/auth/DateNaissancePicker';
import OtpStep from '@/components/auth/OtpStep';

export default function RegisterPage() {
  const { form, set, loading, error, step, handleSubmit, handleSendOtp, handleOtpSuccess, goBack } = useRegister();

  const inputCls = `w-full px-4 py-3.5 bg-[#F8F7F4] border-2 border-transparent rounded-2xl text-sm font-semibold
    text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white outline-none transition-all duration-200`;

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex">
      <RegisterPanel />

      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-lg">+</div>
            <span className="font-black text-xl text-slate-800">MyDoctor TN</span>
          </div>

          {/* ── Étape OTP ── */}
          {step === 'otp' && (
            <OtpStep
               phone={form.telephone}
    onSuccess={handleOtpSuccess}
    onBack={goBack}
    onResend={handleSendOtp}
            />
          )}

          {/* ── Étape Téléphone ── */}
          {step === 'phone' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-8">
                <button onClick={goBack} className="text-slate-400 text-sm font-semibold hover:text-slate-600 mb-4 flex items-center gap-1">
                  ← Retour
                </button>
                <h1 className="text-3xl font-black text-slate-900 mb-2">Vérification WhatsApp</h1>
                <p className="text-slate-400 text-sm font-semibold">
                  Dernière étape — entrez votre numéro pour recevoir le code
                </p>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                  WhatsApp * 💬
                </label>
                <div className="flex gap-2">
                  <span className="px-3 py-3.5 bg-[#F8F7F4] rounded-2xl text-sm font-bold text-slate-500 flex items-center">
                    🇹🇳 +216
                  </span>
                  <input
                    type="tel"
                    maxLength={8}
                    value={form.telephone}
                    onChange={e => set('telephone', e.target.value.replace(/\D/g, ''))}
                    placeholder="98 123 456"
                    className={inputCls}
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-1 ml-1">
                  Un code de vérification sera envoyé sur WhatsApp
                </p>
              </div>

              <ErrorBanner message={error} />

              <button
                onClick={handleSendOtp}
                disabled={loading || form.telephone.length < 8}
                className="w-full py-4 btn-medical text-white rounded-2xl text-sm font-black hover:bg-green-600 disabled:opacity-60 transition-all shadow-lg"
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2 ">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi en cours...
                    </span>
                  : '💬 Recevoir le code sur WhatsApp'
                }
              </button>
            </div>
          )}

          {/* ── Étape Formulaire ── */}
          {step === 'form' && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 mb-2">Créer un compte</h1>
                <p className="text-slate-400 text-sm font-semibold">
                  Déjà inscrit ?{' '}
                  <a href="/login" className="text-emerald-600 font-bold hover:underline">Se connecter</a>
                </p>
              </div>

              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <AuthInput label="Prénom *" type="text" value={form.prenom} onChange={(v: string) => set('prenom', v)} placeholder="Sami" className={inputCls} />
                  <AuthInput label="Nom *" type="text" value={form.nom} onChange={(v: string) => set('nom', v)} placeholder="Trabelsi" className={inputCls} />
                </div>

                <AuthInput label="Email *" type="email" value={form.email} onChange={(v: string) => set('email', v)} placeholder="sami@email.com" className={inputCls} />

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Date de naissance *</label>
                  <DateNaissancePicker value={form.dateNaissance} onChange={(v: string) => set('dateNaissance', v)} />
                </div>

                <div>
                  <AuthInput label="Mot de passe *" type="password" value={form.password} onChange={(v: string) => set('password', v)} placeholder="Minimum 8 caractères" className={inputCls} />
                  <PasswordStrengthBar password={form.password} />
                </div>

                <div>
                  <AuthInput label="Confirmer le mot de passe *" type="password" value={form.confirm} onChange={(v: string) => set('confirm', v)} placeholder="Répétez le mot de passe" className={inputCls} />
                  <PasswordMatchBadge password={form.password} confirm={form.confirm} />
                </div>

                <ErrorBanner message={error} />

                <button onClick={handleSubmit} disabled={loading}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 disabled:opacity-60 transition-all shadow-lg mt-2">
                  Continuer →
                </button>

                <p className="text-center text-[10px] font-semibold text-slate-300">
                  Vous pourrez compléter votre profil après connexion
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}