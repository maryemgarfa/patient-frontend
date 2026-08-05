'use client';
import { useState, useEffect } from 'react';

interface Props {
  phone: string;
  onSuccess: (userId?: string) => void;
  onBack?: () => void;
  onResend?: () => Promise<void>;
}

export default function OtpStep({ phone, onSuccess, onBack, onResend }: Props) {
  const [code, setCode]           = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]         = useState('');
  const [countdown, setCountdown] = useState(60);

  const fullPhone = `+216${phone.replace(/\D/g, '').slice(-8)}`;

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const verifyOtp = async () => {
    if (code.length !== 6) { setError('Code à 6 chiffres requis'); return; }
    setVerifying(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/otp/verify-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Code invalide ou expiré');
      onSuccess(data.userId);
    } catch (e: any) {
      setError(e.message || 'Code invalide ou expiré');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setCode('');
    setError('');
    try {
      await onResend?.();
      setCountdown(60);
    } catch {
      setError('Erreur lors du renvoi');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {onBack && (
        <button onClick={onBack} className="text-slate-400 text-sm font-semibold hover:text-slate-600 flex items-center gap-1">
          ← Retour
        </button>
      )}

      <div className="text-center space-y-2">
        <div className="text-5xl">💬</div>
        <h2 className="text-2xl font-black text-slate-900">Vérification WhatsApp</h2>
        <p className="text-slate-400 text-sm font-semibold">
          Code envoyé sur WhatsApp au <span className="font-bold text-slate-700">{fullPhone}</span>
        </p>
      </div>

      <input
        type="text" inputMode="numeric" maxLength={6}
        value={code}
        onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
        placeholder="_ _ _ _ _ _"
        autoFocus
        className="w-full px-4 py-5 bg-[#F8F7F4] border-2 border-transparent rounded-2xl
          text-3xl font-black text-center text-slate-800 tracking-[0.5em]
          focus:border-green-400 focus:bg-white outline-none transition-all"
      />

      <button
        onClick={verifyOtp}
        disabled={verifying || code.length !== 6}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 disabled:opacity-60 transition-all shadow-lg"
      >
        {verifying ? 'Vérification...' : '✅ Confirmer le code'}
      </button>

      <button
        disabled={countdown > 0 || resending}
        onClick={handleResend}
        className="w-full text-center text-xs font-semibold disabled:text-slate-300 text-green-600 hover:underline disabled:cursor-not-allowed"
      >
        {resending ? 'Envoi...' : countdown > 0 ? `Renvoyer dans ${countdown}s` : '🔄 Renvoyer le code'}
      </button>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl">
          <p className="text-xs font-bold text-red-600">⚠ {error}</p>
        </div>
      )}
    </div>
  );
}