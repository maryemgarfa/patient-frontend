'use client';
// components/rdv/TriageStep.tsx
//
// Étape de triage IA — le patient décrit ses symptômes
// → l'IA retourne : niveau d'urgence + spécialité recommandée + conseils
// → le motif est pré-rempli automatiquement pour l'étape suivante

import { useState } from 'react';
import {
  Brain, AlertTriangle, CheckCircle, ChevronRight,
  Loader2, Stethoscope, Sparkles, SkipForward, ThumbsUp,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TriageResult {
  niveau_urgence:        'URGENCE' | 'URGENT' | 'NORMAL' | 'NON_URGENT';
  score_urgence:         number;
  specialite_recommandee: string;
  message_patient:       string;
  conseils_attente:      string[];
  symptomes_alarme?:     string[];
}

interface Props {
  // Spécialité du médecin déjà sélectionné (optionnel)
  specialiteMedecin?: string;
  // Appelé quand le patient veut continuer (avec ou sans triage)
  onNext: (motifPrefill: string, triageResult: TriageResult | null) => void;
  // Appelé si le patient veut passer l'étape
  onSkip: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const URGENCE_CONFIG = {
  URGENCE: {
    color:   'text-red-700',
    bg:      'bg-red-100 border-red-300',
    badge:   'bg-red-200 text-red-800',
    icon:    AlertTriangle,
    label:   'Urgence — Appelez le 15 (SAMU)',
  },
  URGENT: {
    color:   'text-red-600',
    bg:      'bg-red-50 border-red-200',
    badge:   'bg-red-100 text-red-700',
    icon:    AlertTriangle,
    label:   'Consultation urgente recommandée',
  },
  NORMAL: {
    color:   'text-amber-600',
    bg:      'bg-amber-50 border-amber-200',
    badge:   'bg-amber-100 text-amber-700',
    icon:    Stethoscope,
    label:   'Consultation recommandée',
  },
  NON_URGENT: {
    color:   'text-emerald-600',
    bg:      'bg-emerald-50 border-emerald-200',
    badge:   'bg-emerald-100 text-emerald-700',
    icon:    CheckCircle,
    label:   'Consultation de routine',
  },
};

const SYMPTOMES_RAPIDES = [
  'Douleur', 'Fièvre', 'Fatigue', 'Maux de tête',
  'Toux', 'Essoufflement', 'Nausées', 'Vertiges',
];

// ─── Composant ────────────────────────────────────────────────────────────────

export function TriageStep({ specialiteMedecin, onNext, onSkip }: Props) {
  const [description, setDescription] = useState('');
  const [age,         setAge]         = useState('');
  const [symptomes,   setSymptomes]   = useState<string[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState<TriageResult | null>(null);
  const [error,       setError]       = useState('');

  const toggleSymptome = (s: string) =>
    setSymptomes(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );

  const handleAnalyse = async () => {
    if (!description.trim() && symptomes.length === 0) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('http://localhost:3000/ai/triage', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          description_libre: description.trim() || undefined,
          age:               age ? parseInt(age) : undefined,
          symptomes:         symptomes.length > 0 ? symptomes : undefined,
        }),
      });

      if (!res.ok) throw new Error('Erreur serveur');
      const data: TriageResult = await res.json();
      setResult(data);
    } catch {
      setError('Impossible d\'analyser les symptômes. Vous pouvez continuer sans triage.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    const motif = result
      ? `${description ? description + ' — ' : ''}Triage IA : ${result.niveau_urgence} (${result.specialite_recommandee})`
      : description;
    onNext(motif, result);
  };

  const urgenceConfig = result ? URGENCE_CONFIG[result.niveau_urgence] : null;

  return (
    <div className="p-7 space-y-5 max-w-xl mx-auto">

      {/* ── En-tête ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-violet-200">
          <Brain size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-800">Analyse IA de vos symptômes</p>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">
            Décrivez vos symptômes pour une recommandation personnalisée
          </p>
        </div>
        <div className="ml-auto">
          <Sparkles size={14} className="text-violet-400" />
        </div>
      </div>

      {/* ── Symptômes rapides ──────────────────────────────────────────────── */}
      {!result && (
        <>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
              Symptômes fréquents
            </p>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMES_RAPIDES.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSymptome(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    symptomes.includes(s)
                      ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:bg-violet-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Description libre */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Description <span className="text-slate-300 normal-case font-bold">(optionnel)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex : j'ai mal à la tête depuis 2 jours, accompagné de fièvre..."
              rows={3}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-violet-300 resize-none transition-all placeholder:text-slate-300"
            />
          </div>

          {/* Âge */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Âge <span className="text-slate-300 normal-case font-bold">(optionnel)</span>
            </label>
            <input
              type="number"
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="Ex : 35"
              min={1} max={120}
              className="w-32 px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-violet-300 transition-all placeholder:text-slate-300"
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {/* Bouton analyser */}
          <button
            onClick={handleAnalyse}
            disabled={loading || (description.trim() === '' && symptomes.length === 0)}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-violet-200 disabled:opacity-40 flex items-center justify-center gap-2 transition-all hover:opacity-90"
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Analyse en cours...</>
              : <><Sparkles size={16} /> Analyser mes symptômes</>
            }
          </button>
        </>
      )}

      {/* ── Résultat triage ────────────────────────────────────────────────── */}
      {result && urgenceConfig && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">

          {/* Badge urgence */}
          <div className={`p-4 border rounded-2xl ${urgenceConfig.bg}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${urgenceConfig.badge}`}>
                <urgenceConfig.icon size={16} />
              </div>
              <div>
                <p className={`text-xs font-black uppercase tracking-wide ${urgenceConfig.color}`}>
                  {urgenceConfig.label}
                </p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                  Score d'urgence : {result.score_urgence}/10
                </p>
              </div>
              <div className={`ml-auto px-2.5 py-1 rounded-lg text-[10px] font-black ${urgenceConfig.badge}`}>
                {result.specialite_recommandee}
              </div>
            </div>
            <p className="text-xs font-bold text-slate-700 leading-relaxed">
              {result.message_patient}
            </p>
          </div>

          {/* Spécialité recommandée vs médecin sélectionné */}
          {specialiteMedecin && result.specialite_recommandee.toUpperCase() !== specialiteMedecin.toUpperCase() && (
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
              <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                L'IA recommande un <strong>{result.specialite_recommandee}</strong>, mais vous avez sélectionné un médecin en <strong>{specialiteMedecin.replace(/_/g, ' ')}</strong>. Vous pouvez continuer si vous le souhaitez.
              </p>
            </div>
          )}

          {/* Conseils recommandés */}
          {result.conseils_attente?.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                Conseils en attendant la consultation
              </p>
              {result.conseils_attente.map((action, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <ThumbsUp size={10} className="text-emerald-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-600">{action}</p>
                </div>
              ))}
            </div>
          )}

          {/* Bouton continuer */}
          <button
            onClick={handleContinue}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all hover:opacity-90"
          >
            <CheckCircle size={16} />
            Continuer la prise de rendez-vous
            <ChevronRight size={16} />
          </button>

          {/* Recommencer */}
          <button
            onClick={() => { setResult(null); setError(''); }}
            className="w-full py-2.5 text-slate-400 text-xs font-bold hover:text-slate-600 transition-all"
          >
            ↺ Modifier mes symptômes
          </button>
        </div>
      )}

      {/* ── Passer l'étape ─────────────────────────────────────────────────── */}
      {!result && !loading && (
        <button
          onClick={onSkip}
          className="w-full py-2.5 text-slate-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:text-slate-600 transition-all"
        >
          <SkipForward size={13} />
          Passer cette étape
        </button>
      )}
    </div>
  );
}