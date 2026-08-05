'use client';
// components/patient/ChatbotSymptomes.tsx
// Chatbot d'orientation patient — arbre de questions dynamique
// Chaque réponse change la question suivante (2-3 choix max + texte libre)

import { useState, useEffect, useRef } from 'react';
import {
  Bot, Send, ChevronRight, AlertTriangle, Stethoscope,
  Clock, Sparkles, RefreshCw, X, CheckCircle,
} from 'lucide-react';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role:    'bot' | 'patient';
  content: string;
  choix?:  string[];
  libre?:  boolean;
  etape?:  number;
}

interface Resultat {
  specialite_recommandee: string;
  score_urgence:          number;
  niveau_urgence:         'URGENCE' | 'URGENT' | 'NORMAL' | 'NON_URGENT';
  message_patient:        string;
  conseils_attente:       string[];
  symptomes_alarme:       string[];
}

interface Props {
  onSpecialiteChoisie?: (specialite: string) => void;
  onReset?:             () => void;
}

// ─── Couleurs urgence ─────────────────────────────────────────────────────────

const URGENCE_CONFIG = {
  URGENCE:    { bg: 'bg-red-50',     border: 'border-red-300',   text: 'text-red-700',    badge: 'bg-red-500',     label: '🚨 Urgence',    desc: 'Consultez immédiatement' },
  URGENT:     { bg: 'bg-amber-50',   border: 'border-amber-300', text: 'text-amber-700',  badge: 'bg-amber-500',   label: '⚡ Urgent',     desc: 'Dans les 24h' },
  NORMAL:     { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-500', label: '✅ Normal',  desc: 'Dans la semaine' },
  NON_URGENT: { bg: 'bg-slate-50',   border: 'border-slate-200', text: 'text-slate-600',  badge: 'bg-slate-400',   label: '💤 Non urgent', desc: 'Quand vous voulez' },
};

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ChatbotSymptomes({ onSpecialiteChoisie, onReset }: Props) {
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [etape,      setEtape]      = useState(0);
  const [texte,      setTexte]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [resultat,   setResultat]   = useState<Resultat | null>(null);
  const [historique, setHistorique] = useState<{ role: string; content: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // ── Init : charger première question ───────────────────────────────────────
  useEffect(() => {
    initChat();
  }, []);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const initChat = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/chatbot/chat/init');
      const { question, choix, avec_texte_libre } = res.data;
      setMessages([{
        role:    'bot',
        content: question,
        choix,
        libre:   avec_texte_libre,
        etape:   1,
      }]);
      setEtape(1);
    } catch {
      setMessages([{
        role:    'bot',
        content: "Bonjour 👋 Qu'est-ce qui vous amène aujourd'hui ?",
        choix:   ["Douleur", "Fièvre", "Problème cutané", "Trouble digestif", "Fatigue", "Autre"],
        libre:   true,
        etape:   1,
      }]);
      setEtape(1);
    }
    setLoading(false);
  };

  // ── Envoyer une réponse ────────────────────────────────────────────────────
  const envoyerReponse = async (reponse: string) => {
    if (!reponse.trim() || loading) return;

    const msgPatient: Message = { role: 'patient', content: reponse };
    const nouvelHistorique = [...historique, { role: 'bot', content: messages[messages.length - 1]?.content ?? '' }, { role: 'patient', content: reponse }];

    setMessages(prev => [...prev, msgPatient]);
    setHistorique(nouvelHistorique);
    setTexte('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chatbot/chat', {
        historique: nouvelHistorique.map(m => ({ role: m.role, content: m.content })),
        reponse,
        etape,
      });

      const { question, choix, avec_texte_libre, etape: nouvelleEtape, termine, resultat: res_resultat } = res.data;

      setEtape(nouvelleEtape);

      if (termine && res_resultat) {
        // Message de transition
        setMessages(prev => [...prev, {
          role:    'bot',
          content: '⏳ Analyse de vos symptômes...',
          etape:   nouvelleEtape,
        }]);

        // Petit délai pour l'effet visuel
        await new Promise(r => setTimeout(r, 800));

        setResultat(res_resultat);
        setMessages(prev => [
          ...prev.filter(m => m.content !== '⏳ Analyse de vos symptômes...'),
          {
            role:    'bot',
            content: res_resultat.message_patient,
            etape:   nouvelleEtape,
          },
        ]);
      } else {
        setMessages(prev => [...prev, {
          role:    'bot',
          content: question,
          choix,
          libre:   avec_texte_libre,
          etape:   nouvelleEtape,
        }]);
      }
    } catch (err: any) {
      console.error('Erreur chatbot:', err.response?.status, err.response?.data ?? err.message);
      setMessages(prev => [...prev, {
        role:    'bot',
        content: `Erreur ${err.response?.status ?? ''}: ${JSON.stringify(err.response?.data ?? err.message)}`,
        etape,
      }]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      envoyerReponse(texte);
    }
  };

  const reset = () => {
    setMessages([]);
    setEtape(0);
    setTexte('');
    setResultat(null);
    setHistorique([]);
    initChat();
    onReset?.();
  };

  // Dernier message bot avec choix (pour afficher les boutons)
  const dernierBotAvecChoix = [...messages].reverse().find(
    m => m.role === 'bot' && m.choix && m.choix.length > 0
  );
  const peutTaper = !resultat && (
    dernierBotAvecChoix?.libre === true ||
    !dernierBotAvecChoix
  );

  const cfg = resultat ? URGENCE_CONFIG[resultat.niveau_urgence] ?? URGENCE_CONFIG.NORMAL : null;

  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col h-full">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-white">Assistant médical</p>
            <p className="text-[10px] text-emerald-100 font-bold">Je vous aide à trouver le bon médecin</p>
          </div>
        </div>
        {messages.length > 1 && (
          <button onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-[10px] font-black transition-all">
            <RefreshCw size={10} /> Recommencer
          </button>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'patient' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'bot' && (
              <div className="w-7 h-7 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <Bot size={13} className="text-emerald-600" />
              </div>
            )}
            <div className={`max-w-[80%] ${msg.role === 'patient' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
              <div className={`px-4 py-2.5 rounded-2xl text-sm font-bold leading-relaxed ${
                msg.role === 'patient'
                  ? 'bg-emerald-600 text-white rounded-tr-sm'
                  : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>

              {/* Boutons de choix — seulement sur le dernier message bot */}
              {msg.role === 'bot' && msg.choix && msg.choix.length > 0 && !resultat && i === messages.length - 1 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {msg.choix.map((choix, j) => (
                    <button
                      key={j}
                      onClick={() => envoyerReponse(choix)}
                      disabled={loading}
                      className="px-3 py-1.5 bg-white border-2 border-emerald-200 text-emerald-700 rounded-xl text-xs font-black hover:bg-emerald-50 hover:border-emerald-400 transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <ChevronRight size={10} />
                      {choix}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0 mr-2">
              <Bot size={13} className="text-emerald-600" />
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Résultat d'orientation ── */}
      {resultat && cfg && (
        <div className={`mx-4 mb-4 rounded-2xl border-2 ${cfg.bg} ${cfg.border} overflow-hidden`}>
          <div className="px-4 py-3">
            {/* Badge urgence */}
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[10px] font-black text-white px-3 py-1 rounded-full ${cfg.badge}`}>
                {cfg.label}
              </span>
              <span className={`text-[10px] font-bold ${cfg.text}`}>{cfg.desc}</span>
            </div>

            {/* Spécialité recommandée */}
            <div className={`flex items-center gap-2 p-3 bg-white/70 rounded-xl border ${cfg.border} mb-3`}>
              <Stethoscope size={16} className={cfg.text} />
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Spécialité recommandée</p>
                <p className={`text-sm font-black ${cfg.text}`}>{resultat.specialite_recommandee}</p>
              </div>
            </div>

            {/* Conseils */}
            {resultat.conseils_attente.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {resultat.conseils_attente.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Clock size={10} className={cfg.text} />
                    <p className={`text-xs font-bold ${cfg.text}`}>{c}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Symptômes alarme */}
            {resultat.symptomes_alarme.length > 0 && (
              <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl mb-3">
                <p className="text-[9px] font-black text-red-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <AlertTriangle size={8} /> Appelez le 15 si
                </p>
                {resultat.symptomes_alarme.map((s, i) => (
                  <p key={i} className="text-[10px] font-bold text-red-600">• {s}</p>
                ))}
              </div>
            )}

            {/* CTA → voir médecins */}
            {resultat.niveau_urgence !== 'URGENCE' && onSpecialiteChoisie && (
              <button
                onClick={() => onSpecialiteChoisie(resultat.specialite_recommandee)}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-black shadow-md shadow-emerald-100 flex items-center justify-center gap-2 hover:opacity-90 transition-all"
              >
                <Sparkles size={14} />
                Voir les médecins disponibles
                <ChevronRight size={14} />
              </button>
            )}

            {/* Urgence absolue */}
        {/* Urgence absolue — recommandation forte, jamais une action automatique */}
            {resultat.niveau_urgence === 'URGENCE' && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-red-700 text-center">
                  Nous vous recommandons fortement de contacter les urgences dès maintenant.
                </p>
                <a href="tel:15"
                  className="w-full py-3 bg-red-600 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-red-700 transition-all">
                  <AlertTriangle size={14} />
                  Appeler le 15 (SAMU)
                </a>
                {onSpecialiteChoisie && (
                  <button
                    onClick={() => onSpecialiteChoisie(resultat.specialite_recommandee)}
                    className="w-full py-2.5 bg-white border-2 border-red-200 text-red-700 rounded-xl text-xs font-black hover:bg-red-50 transition-all"
                  >
                    Voir quand même les médecins disponibles
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Zone de saisie texte libre ── */}
      {!resultat && (
        <div className="px-4 pb-4">
          <div className={`flex items-center gap-2 bg-slate-50 border-2 rounded-2xl px-4 py-2.5 transition-all ${
            peutTaper ? 'border-slate-200 focus-within:border-emerald-300' : 'border-slate-100 opacity-50'
          }`}>
            <input
              ref={inputRef}
              value={texte}
              onChange={e => setTexte(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={peutTaper ? "Ou décrivez en quelques mots..." : "Choisissez une réponse ci-dessus"}
              disabled={!peutTaper || loading}
              className="flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300 disabled:cursor-not-allowed"
            />
            <button
              onClick={() => envoyerReponse(texte)}
              disabled={!texte.trim() || loading || !peutTaper}
              className="w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 transition-all shrink-0"
            >
              <Send size={13} />
            </button>
          </div>
          {!peutTaper && !loading && (
            <p className="text-[9px] font-bold text-slate-400 text-center mt-1.5">
              Sélectionnez une réponse parmi les boutons
            </p>
          )}
        </div>
      )}
    </div>
  );
}