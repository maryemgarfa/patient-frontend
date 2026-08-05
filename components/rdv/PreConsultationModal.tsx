'use client';
// components/rdv/PreConsultationModal.tsx
// Chargement auto profil patient + symptômes par spécialité + OCR + validation image floue
// Champs profil pré-remplis mais toujours modifiables (badge vert = depuis profil, ambre = à compléter)
// ARCHITECTURE : le résumé IA est EXCLUSIVEMENT destiné au médecin.
// Le patient voit uniquement un message de confirmation après envoi.
// LIMITE : 3 documents maximum par pré-consultation.
// LANGUE  : uniquement les documents en français sont acceptés.

import { useState, useEffect, useRef } from 'react';
import {
  Brain, Upload, X, CheckCircle, Loader2, FileText,
  AlertTriangle, Sparkles, ChevronRight, Stethoscope,
  Clock, Paperclip, User, Shield, Pill, Info,
} from 'lucide-react';
import api from '@/lib/api';

interface Props {
  appointmentId: string;
  medecinNom:    string;
  specialite:    string;
  dateRdv:       string;
  onClose:       () => void;
  onDone:        () => void;
}

interface PatientContext {
  patient: {
    age:                      number | null;
    sexe:                     string | null;
    groupeSanguin:            string | null;
    poids:                    number | null;
    taille:                   number | null;
    allergies:                string | null;
    maladies_chroniques:      string | null;
    medicaments_actuels:      string | null;
    antecedents_chirurgicaux: string | null;
  };
  documents: { id: string; titre: string; type: string; url: string; fichierNom: string | null }[];
  preconsultation_envoyee: boolean;
}

interface PreConsultationResult {
  resume_symptomes:        string;
  duree_evolution:         string;
  intensite_douleur:       number | null;
  antecedents_pertinents:  string[];
  points_attention:        string[];
  alerte_urgence:          boolean;
  message_urgence?:        string;
}

interface OcrError {
  fileName: string;
  message:  string;
  conseil?: string;
}

const MAX_DOCUMENTS = 2;

const SYMPTOMES_PAR_SPECIALITE: Record<string, string[]> = {
  CARDIOLOGIE:       ['Douleur thoracique', 'Palpitations', 'Essoufflement', 'Fatigue', 'Vertiges', 'Oedèmes jambes', 'Syncope'],
  GYNECOLOGIE:       ['Douleurs pelviennes', 'Saignements', 'Pertes inhabituelles', 'Douleurs règles', 'Fatigue', 'Nausées', 'Bouffées chaleur'],
  NEUROLOGIE:        ['Maux de tête', 'Vertiges', 'Engourdissements', 'Troubles vision', 'Fatigue', 'Troubles mémoire', 'Tremblements'],
  PNEUMOLOGIE:       ['Toux', 'Essoufflement', 'Douleur thoracique', 'Sifflements', 'Fatigue', 'Expectorations', 'Fièvre'],
  DERMATOLOGIE:      ['Éruption cutanée', 'Démangeaisons', 'Boutons', 'Plaie', 'Taches', 'Sécheresse peau', 'Gonflement'],
  GASTRO_ENTEROLOGIE:['Douleur abdominale', 'Nausées', 'Vomissements', 'Diarrhée', 'Constipation', 'Brûlures estomac', 'Perte appétit'],
  PEDIATRIE:         ['Fièvre', 'Toux', 'Douleur', 'Fatigue', 'Nausées', 'Éruption', 'Pleurs excessifs'],
  PSYCHIATRE:        ['Anxiété', 'Insomnie', 'Tristesse', 'Fatigue', 'Irritabilité', 'Perte motivation', 'Troubles concentration'],
  ORTHOPEDIE:        ['Douleur articulaire', 'Gonflement', 'Raideur', 'Douleur dos', 'Limitation mouvement', 'Traumatisme', 'Faiblesse'],
  NUTRITIONNISTE:    ['Prise de poids', 'Perte de poids', 'Fatigue', 'Troubles digestifs', 'Ballonnements', 'Fringales'],
  DENTISTE:          ['Douleur dentaire', 'Gencives saignent', 'Sensibilité', 'Gonflement joue', 'Mauvaise haleine', 'Dent cassée'],
  MEDECINE_GENERALE: ['Fièvre', 'Fatigue', 'Douleur', 'Toux', 'Maux de tête', 'Nausées', 'Vertiges', 'Essoufflement'],
  OPHTALMOLOGIE:     ['Vision floue', 'Douleur oeil', 'Rougeur', 'Larmoiement', 'Photophobie', 'Corps étranger'],
};

const DUREES = ["Aujourd'hui", '2-3 jours', '1 semaine', '2 semaines', '1 mois', 'Plus d\'1 mois'];

function BadgeProfil({ filled }: { filled: boolean }) {
  if (filled) return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-0.5">
      <CheckCircle size={8} /> Depuis votre profil
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2 py-0.5">
      <Info size={8} /> À compléter
    </span>
  );
}

export function PreConsultationModal({
  appointmentId, medecinNom, specialite, dateRdv, onClose, onDone,
}: Props) {
  // 'result' n'est utilisé QUE pour les alertes urgence (patient doit voir l'alerte)
  const [step, setStep] = useState<'loading-context' | 'form' | 'analysing' | 'result' | 'sending' | 'sent'>('loading-context');
  const [context, setContext] = useState<PatientContext | null>(null);

  const [age,         setAge]         = useState('');
  const [allergies,   setAllergies]   = useState('');
  const [maladies,    setMaladies]    = useState('');
  const [medicaments, setMedicaments] = useState('');
  const [groupeSanguin, setGroupeSanguin] = useState('');

  const [symptomes,  setSymptomes]  = useState<string[]>([]);
  const [duree,      setDuree]      = useState('');
  const [intensite,  setIntensite]  = useState(5);
  const [files,      setFiles]      = useState<File[]>([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrErrors,  setOcrErrors]  = useState<OcrError[]>([]);
  const [result,     setResult]     = useState<PreConsultationResult | null>(null);
  const [error,      setError]      = useState('');

  const fileRef = useRef<HTMLInputElement>(null);



  const [ocrResults, setOcrResults] = useState<{fileName: string; text: string}[]>([]);
const ocrResultsRef = useRef<{fileName: string; text: string}[]>([]);

  const specKey = specialite.toUpperCase().replace(/ /g, '_').replace(/-/g, '').replace(/É/g,'E').replace(/È/g,'E');
  const symptomesDisponibles = SYMPTOMES_PAR_SPECIALITE[specKey] ?? SYMPTOMES_PAR_SPECIALITE['MEDECINE_GENERALE'];

  useEffect(() => {
    api.get(`/appointments/patient/${appointmentId}/context`)
      .then(res => {
        const ctx: PatientContext = res.data;
        setContext(ctx);
        if (ctx.patient.age)                 setAge(String(ctx.patient.age));
        if (ctx.patient.allergies)           setAllergies(ctx.patient.allergies);
        if (ctx.patient.maladies_chroniques) setMaladies(ctx.patient.maladies_chroniques);
        if (ctx.patient.medicaments_actuels) setMedicaments(ctx.patient.medicaments_actuels);
        if (ctx.patient.groupeSanguin)       setGroupeSanguin(ctx.patient.groupeSanguin);
        setStep('form');
      })
      .catch(() => setStep('form'));
  }, [appointmentId]);

  // ─────────────────────────────────────────────────────────────────────────
  // handleFiles — limite à MAX_DOCUMENTS (3) fichiers au total
  // ─────────────────────────────────────────────────────────────────────────
  const handleFiles = async (newFiles: File[]) => {
    // Vérifier la limite AVANT de traiter
    const remaining = MAX_DOCUMENTS - files.length;
    if (remaining <= 0) {
      setOcrErrors(prev => [...prev, {
        fileName: newFiles[0]?.name ?? '',
        message:  `Maximum ${MAX_DOCUMENTS} documents par pré-consultation. Supprimez un fichier pour en ajouter un autre.`,
      }]);
      return;
    }

    // Tronquer la sélection si elle dépasse la limite restante
    const filesToProcess = newFiles.slice(0, remaining);
    if (filesToProcess.length < newFiles.length) {
      setOcrErrors(prev => [...prev, {
        fileName: newFiles[remaining]?.name ?? '',
        message:  `Limite atteinte : seul${remaining > 1 ? 's les' : ' le'} ${remaining} premier${remaining > 1 ? 's' : ''} fichier${remaining > 1 ? 's ont' : ' a'} été ajouté${remaining > 1 ? 's' : ''} (max ${MAX_DOCUMENTS}).`,
      }]);
    }

    setFiles(prev => [...prev, ...filesToProcess]);
    setOcrErrors([]);
    setOcrLoading(true);
// Filtrer les fichiers déjà uploadés (même nom + même taille)
const filesDejaPresents = newFiles.filter(newFile =>
  files.some(existing => 
    existing.name === newFile.name && existing.size === newFile.size
  )
);

if (filesDejaPresents.length > 0) {
  setOcrErrors(prev => [...prev, {
    fileName: filesDejaPresents[0].name,
    message: "Ce document a déjà été ajouté.",
    conseil: "Chaque document ne peut être uploadé qu'une seule fois.",
  }]);
  // Retirer les doublons de la liste à traiter
  newFiles = newFiles.filter(newFile =>
    !files.some(existing => 
      existing.name === newFile.name && existing.size === newFile.size
    )
  );
  if (newFiles.length === 0) return;
}
    for (const file of filesToProcess) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('specialite', specialite);

        const res = await api.post('/ai/ocr', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

    const text = res.data?.texte_extrait || '';
if (text) {
  const entry = { fileName: file.name, text };
  ocrResultsRef.current = [...ocrResultsRef.current, entry];
  setOcrResults([...ocrResultsRef.current]);
}

      } catch (err: any) {
        setFiles(prev => prev.filter(f => f !== file));
        const detail = err?.response?.data?.detail;

        if (detail?.code === 'IMAGE_FLOUE') {
          setOcrErrors(prev => [...prev, { fileName: file.name, message: detail.message, conseil: detail.conseil }]);
        } else if (detail?.code === 'DOCUMENT_HORS_SPECIALITE') {
          setOcrErrors(prev => [...prev, { fileName: file.name, message: detail.message, conseil: detail.conseil }]);
        } else if (detail?.code === 'IMAGE_TROP_PETITE') {
          setOcrErrors(prev => [...prev, { fileName: file.name, message: detail.message }]);
        } else if (detail?.code === 'DOCUMENT_NON_MEDICAL') {
          setOcrErrors(prev => [...prev, { fileName: file.name, message: detail.message, conseil: detail.conseil }]);
        } else if (detail?.code === 'FICHIER_ILLISIBLE') {
          setOcrErrors(prev => [...prev, { fileName: file.name, message: detail.message ?? 'Fichier corrompu ou illisible.' }]);
        } else if (detail?.code === 'LANGUE_NON_SUPPORTEE') {
          // Document en arabe ou autre langue non supportée
          setOcrErrors(prev => [...prev, { fileName: file.name, message: detail.message, conseil: detail.conseil }]);
        } else {
          setOcrErrors(prev => [...prev, { fileName: file.name, message: 'Erreur lors de la lecture. Vérifiez le format du fichier (PDF, JPG, PNG).' }]);
        }
      }
    }
    setOcrLoading(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // handleAnalyse — analyse IA puis envoi direct au médecin
  // Le résumé N'EST JAMAIS affiché au patient (sauf alerte urgence)
  // ─────────────────────────────────────────────────────────────────────────
  const handleAnalyse = async () => {
    if (symptomes.length === 0) { setError('Sélectionnez au moins un symptôme.'); return; }
    setError('');
    setStep('analysing');

    const descriptionComplete = [
      allergies   ? `Allergies : ${allergies}` : '',
      maladies    ? `Maladies chroniques : ${maladies}` : '',
      medicaments ? `Médicaments actuels : ${medicaments}` : '',
ocrResultsRef.current.length > 0 
  ? `Documents analysés : ${ocrResultsRef.current.map(r => r.text).join(' | ')}` 
  : '',    ].filter(Boolean).join('\n');

    try {
      const res = await api.post('/ai/triage', {
        description_libre:  descriptionComplete || undefined,
        symptomes,
        age:                age ? parseInt(age) : undefined,
        duree:              duree || undefined,
        intensite,
        antecedents:        maladies ? maladies.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        specialite_medecin: specialite,
      });

      const r = res.data as PreConsultationResult;
      setResult(r);

      // Cas urgence : on affiche l'alerte au patient AVANT d'envoyer
      if (r.alerte_urgence) {
        setStep('result');
        return;
      }

      // Cas normal : envoi direct — patient ne voit jamais le résumé clinique
      await sendToMedecin(r);

    } catch {
      setError("Erreur lors de l'analyse. Réessayez.");
      setStep('form');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // sendToMedecin — appelé soit directement, soit depuis le bouton urgence
  // ─────────────────────────────────────────────────────────────────────────
  const sendToMedecin = async (r: PreConsultationResult) => {
    setStep('sending');
    try {
      await api.post(`/appointments/patient/${appointmentId}/preconsultation`, {
        resume_symptomes:       r.resume_symptomes,
        points_attention:       r.points_attention,
        antecedents_pertinents: r.antecedents_pertinents,
        alerte_urgence:         r.alerte_urgence,
        symptomes,
        intensite,
        duree,
      });
    } catch {
      // On passe quand même à 'sent' — l'envoi est best-effort
    }
    setStep('sent');
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const inputBorderClass = (filled: boolean) =>
    `bg-white border-2 rounded-xl text-sm font-bold outline-none focus:border-violet-300 transition-all placeholder:text-slate-300 ${
      filled ? 'border-emerald-100' : 'border-amber-100'
    }`;

  const limitAtteinte = files.length >= MAX_DOCUMENTS;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-7 pt-7 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-200">
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">Préparer ma consultation</p>
              <p className="text-[10px] font-bold text-slate-400">{medecinNom} · {fmtDate(dateRdv)} à {fmtTime(dateRdv)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-all">
            <X size={14} className="text-slate-500" />
          </button>
        </div>

        <div className="px-7 pb-7 pt-5 space-y-5">

          {/* ── Chargement ── */}
          {step === 'loading-context' && (
            <div className="py-16 text-center space-y-3">
              <Loader2 size={28} className="text-violet-500 animate-spin mx-auto" />
              <p className="text-sm font-black text-slate-600">Chargement de votre dossier...</p>
            </div>
          )}

          {/* ── Formulaire ── */}
          {step === 'form' && (
            <>
              {/* Profil médical */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <User size={13} className="text-slate-500" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Votre profil médical</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Âge</label>
                    <BadgeProfil filled={!!context?.patient.age} />
                  </div>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="Ex: 35"
                    className={`w-32 px-3 py-2 ${inputBorderClass(!!context?.patient.age)}`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Groupe sanguin</label>
                    <BadgeProfil filled={!!context?.patient.groupeSanguin} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
                      <button key={g} onClick={() => setGroupeSanguin(g)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          groupeSanguin === g
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:bg-rose-50'
                        }`}>{g}</button>
                    ))}
                  </div>
                </div>

                {(context?.patient.poids || context?.patient.taille) && (
                  <div className="grid grid-cols-2 gap-3">
                    {context?.patient.poids && (
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Poids</label>
                        <p className="text-sm font-black text-slate-700 px-3 py-2 bg-white border border-slate-100 rounded-xl">{context.patient.poids} kg</p>
                      </div>
                    )}
                    {context?.patient.taille && (
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Taille</label>
                        <p className="text-sm font-black text-slate-700 px-3 py-2 bg-white border border-slate-100 rounded-xl">{context.patient.taille} cm</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Shield size={10} /> Allergies
                    </label>
                    <BadgeProfil filled={!!context?.patient.allergies} />
                  </div>
                  <input
                    value={allergies}
                    onChange={e => setAllergies(e.target.value)}
                    placeholder="Ex: pénicilline, aspirine..."
                    className={`w-full px-3 py-2 ${inputBorderClass(!!context?.patient.allergies)}`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Maladies chroniques</label>
                    <BadgeProfil filled={!!context?.patient.maladies_chroniques} />
                  </div>
                  <input
                    value={maladies}
                    onChange={e => setMaladies(e.target.value)}
                    placeholder="Ex: diabète, hypertension..."
                    className={`w-full px-3 py-2 ${inputBorderClass(!!context?.patient.maladies_chroniques)}`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Pill size={10} /> Médicaments actuels
                    </label>
                    <BadgeProfil filled={!!context?.patient.medicaments_actuels} />
                  </div>
                  <input
                    value={medicaments}
                    onChange={e => setMedicaments(e.target.value)}
                    placeholder="Ex: metformine 500mg..."
                    className={`w-full px-3 py-2 ${inputBorderClass(!!context?.patient.medicaments_actuels)}`}
                  />
                </div>
              </div>

              {/* Symptômes */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                  Symptômes actuels <span className="text-red-400">*</span>
                  <span className="text-slate-300 normal-case font-bold ml-1">· {specialite.replace(/_/g, ' ')}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {symptomesDisponibles.map(s => (
                    <button key={s}
                      onClick={() => setSymptomes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        symptomes.includes(s)
                          ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:bg-violet-50'
                      }`}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Durée */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Depuis quand ?</p>
                <div className="flex flex-wrap gap-2">
                  {DUREES.map(d => (
                    <button key={d} onClick={() => setDuree(d)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        duree === d ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}>{d}</button>
                  ))}
                </div>
              </div>

              {/* Intensité */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Intensité : <span className="text-violet-600">{intensite}/10</span>
                </p>
                <input type="range" min={1} max={10} value={intensite} onChange={e => setIntensite(parseInt(e.target.value))} className="w-full accent-violet-600" />
                <div className="flex justify-between text-[9px] font-bold text-slate-300 mt-1">
                  <span>Légère</span><span>Modérée</span><span>Intense</span>
                </div>
              </div>

              {/* Documents dossier existants */}
              {context?.documents && context.documents.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                    Documents dans votre dossier <span className="text-emerald-500">({context.documents.length})</span>
                  </p>
                  <div className="space-y-2">
                    {context.documents.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 bg-violet-50 border border-violet-100 rounded-xl">
                        <FileText size={13} className="text-violet-500 shrink-0" />
                        <p className="text-xs font-bold text-slate-600 flex-1 truncate">{doc.titre}</p>
                        <span className="text-[9px] font-black text-violet-500 bg-violet-100 px-2 py-0.5 rounded-lg">{doc.type.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                    <p className="text-[10px] font-bold text-violet-600 flex items-center gap-1.5">
                      <Sparkles size={10} /> Ces documents seront inclus dans le résumé envoyé au médecin
                    </p>
                  </div>
                </div>
              )}

              {/* Upload nouveaux documents */}
              <div>
                {/* Label avec compteur */}
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                  Ajouter un document{' '}
                  <span className={`normal-case font-bold ${limitAtteinte ? 'text-red-400' : 'text-slate-300'}`}>
                    (optionnel · {files.length}/{MAX_DOCUMENTS} max)
                  </span>
                </p>

                {/* Zone de drop — désactivée si limite atteinte */}
                <div
                  onClick={() => !limitAtteinte && fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                    limitAtteinte
                      ? 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-50'
                      : 'border-slate-200 cursor-pointer hover:border-violet-300 hover:bg-violet-50/50'
                  }`}
                >
                  <Upload size={18} className="text-slate-300 mx-auto mb-2" />
                  {limitAtteinte ? (
                    <p className="text-xs font-bold text-slate-400">Limite de {MAX_DOCUMENTS} documents atteinte</p>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-slate-400">Ordonnances, analyses, radios...</p>
                      <p className="text-[10px] font-bold text-slate-300 mt-1">PDF, JPG, PNG · Max 20 MB · Documents en français uniquement</p>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.tiff"
                    className="hidden"
                    disabled={limitAtteinte}
                    onChange={e => { if (e.target.files) handleFiles(Array.from(e.target.files)); }}
                  />
                </div>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <Paperclip size={13} className="text-violet-500 shrink-0" />
                        <p className="text-xs font-bold text-slate-600 flex-1 truncate">{f.name}</p>
                        {ocrLoading && i === files.length - 1
                          ? <Loader2 size={13} className="text-violet-500 animate-spin" />
                          : <CheckCircle size={13} className="text-emerald-500" />
                        }
                        <button onClick={() => {
  const fileName = f.name;
  setFiles(p => p.filter(f => f.name !== fileName));
  ocrResultsRef.current = ocrResultsRef.current.filter(r => r.fileName !== fileName);
  setOcrResults([...ocrResultsRef.current]);
                        }} className="text-slate-300 hover:text-red-400 transition-all">
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                   {ocrResults.length > 0 && (
  <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5">
    <CheckCircle size={10} /> {ocrResults.length}/{MAX_DOCUMENTS} document(s) lu(s) par OCR — contenu intégré au résumé
  </p>
)}
                  </div>
                )}

                {ocrErrors.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {ocrErrors.map((e, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl animate-in slide-in-from-top-2 duration-200">
                        <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-red-600 truncate">{e.fileName}</p>
                          <p className="text-xs font-bold text-red-500 mt-0.5">{e.message}</p>
                          {e.conseil && <p className="text-[10px] font-bold text-red-400 mt-1">💡 {e.conseil}</p>}
                        </div>
                        <button onClick={() => setOcrErrors(prev => prev.filter((_,j) => j !== i))}
                          className="text-red-300 hover:text-red-500 transition-all shrink-0">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className="text-xs font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

              <button onClick={handleAnalyse} disabled={symptomes.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-violet-200 disabled:opacity-40 flex items-center justify-center gap-2 transition-all hover:opacity-90">
                <Sparkles size={16} /> Envoyer au médecin
              </button>
            </>
          )}

          {/* ── Analyse / Envoi en cours ── */}
          {(step === 'analysing' || step === 'sending') && (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto">
                <Loader2 size={28} className="text-violet-600 animate-spin" />
              </div>
              <p className="text-sm font-black text-slate-700">
                {step === 'analysing' ? 'Préparation en cours...' : 'Envoi au médecin...'}
              </p>
              <p className="text-xs font-bold text-slate-400">
                {step === 'analysing'
                  ? 'Vos informations sont analysées'
                  : 'Sauvegarde dans le dossier'}
              </p>
            </div>
          )}

          {/* ── Alerte urgence uniquement ── */}
          {/* Ce step n'est atteint QUE si alerte_urgence === true */}
          {step === 'result' && result && result.alerte_urgence && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
              <div className="p-5 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3">
                <AlertTriangle size={22} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-red-700">⚠️ Symptômes urgents détectés</p>
                  <p className="text-xs font-bold text-red-600 mt-2 leading-relaxed">{result.message_urgence}</p>
                </div>
              </div>

              <p className="text-xs font-bold text-slate-400 text-center">
                Votre résumé sera quand même transmis au médecin.
              </p>

              <div className="flex gap-3">
                <button onClick={() => setStep('form')}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-200 transition-all">
                  Modifier
                </button>
                <button onClick={() => sendToMedecin(result)}
                  className="flex-[2] py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-black shadow-lg shadow-red-200 flex items-center justify-center gap-2 transition-all hover:opacity-90">
                  <ChevronRight size={14} /> Envoyer quand même
                </button>
              </div>
            </div>
          )}

          {/* ── Confirmation finale ── */}
          {step === 'sent' && (
            <div className="py-16 text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle size={36} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-base font-black text-slate-800">Informations envoyées</p>
                <p className="text-sm font-bold text-slate-400 mt-2 leading-relaxed">
                  Vos informations ont été transmises au médecin.<br />
                  Il pourra les consulter avant votre rendez-vous.
                </p>
              </div>
              <button onClick={onDone}
                className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 transition-all">
                Terminer
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}