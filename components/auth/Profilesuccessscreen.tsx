'use client';

import { useEffect, useState } from 'react';

export default function ProfileSuccessScreen({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        className="bg-white rounded-[2.5rem] w-[440px] max-w-full shadow-2xl p-10 text-center"
        style={{
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(16px)',
          transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Animated checkmark */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          {/* Outer ring pulse */}
          <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
          <div className="relative w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg
              viewBox="0 0 52 52"
              className="w-12 h-12"
              style={{
                strokeDasharray: 166,
                strokeDashoffset: visible ? 0 : 166,
                transition: 'stroke-dashoffset 0.6s ease 0.2s',
              }}
            >
              <circle
                cx="26" cy="26" r="24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                style={{
                  strokeDasharray: 166,
                  strokeDashoffset: visible ? 0 : 166,
                  transition: 'stroke-dashoffset 0.6s ease 0.2s',
                }}
              />
              <path
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 27 l8 8 l16 -16"
                style={{
                  strokeDasharray: 48,
                  strokeDashoffset: visible ? 0 : 48,
                  transition: 'stroke-dashoffset 0.4s ease 0.6s',
                }}
              />
            </svg>
          </div>
        </div>

        {/* Confetti dots */}
        <div className="relative">
          {visible && (
            <>
              {[
                { color: 'bg-emerald-400', top: '-40px', left: '20px', delay: '0.3s' },
                { color: 'bg-amber-400',   top: '-50px', left: '80px', delay: '0.4s' },
                { color: 'bg-sky-400',     top: '-35px', right: '30px', delay: '0.35s' },
                { color: 'bg-rose-400',    top: '-45px', right: '80px', delay: '0.45s' },
                { color: 'bg-violet-400',  top: '-30px', left: '50%',   delay: '0.25s' },
              ].map((dot, i) => (
                <span
                  key={i}
                  className={`absolute w-2 h-2 rounded-full ${dot.color}`}
                  style={{
                    top: dot.top,
                    left: dot.left,
                    right: dot.right,
                    animation: `confettiFall 0.8s ease forwards`,
                    animationDelay: dot.delay,
                    opacity: 0,
                  }}
                />
              ))}
            </>
          )}

          <h2
            className="text-2xl font-black text-slate-900 mb-2"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.4s ease 0.5s, transform 0.4s ease 0.5s',
            }}
          >
            Profil complété ! 🎉
          </h2>

          <p
            className="text-slate-400 text-sm font-semibold mb-8"
            style={{
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.4s ease 0.65s',
            }}
          >
            Vos informations ont été sauvegardées avec succès.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 active:scale-95 transition-all"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease 0.8s, transform 0.4s ease 0.8s, background-color 0.15s, transform 0.1s',
          }}
        >
          Commencer à utiliser MyDoctor TN →
        </button>
      </div>

      <style jsx>{`
        @keyframes confettiFall {
          0%   { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(60px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
}