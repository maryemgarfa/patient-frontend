// components/document/DossierTab.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import {
  FileText, Image, BarChart2, File, Pill, Stethoscope,
  Upload, Download, Trash2, ExternalLink, Search, X,
  FolderOpen, ArrowUpDown, Calendar, Filter, Send,
  Lock, Users, ChevronDown, CheckCircle2, AlertCircle, AlertTriangle,
} from 'lucide-react';
import { fmtDateLong, CATEGORY_META } from '@/utils/dossier';
import { uploadDocument, deleteDocument } from '@/services/dossier.service';
import type { PatientDocument, DocumentCategory, DocumentVisibility, Medecin, Appointment } from '@/types/dossier.types';

// ─── Types ───────────────────────────────────────────────────────────────────
type SortKey = 'date_desc' | 'date_asc' | 'nom' | 'type';

// ─── Constantes ──────────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<DocumentCategory, React.ElementType> = {
  ORDONNANCE:          Pill,
  ANALYSE_BIOLOGIQUE:  BarChart2,
  IMAGERIE_RADIO:      Image,
  NOTE_PATIENT:        FileText,
  AUTRE:               File,
};

const CATEGORY_CONFIG: Record<DocumentCategory, { label: string; color: string; bg: string; border: string; accent: string }> = {
  ORDONNANCE:          { label: 'Ordonnances',    color: 'text-violet-600', bg: 'bg-violet-50',  border: 'border-violet-100', accent: '#7c3aed' },
  ANALYSE_BIOLOGIQUE:  { label: 'Analyses',       color: 'text-rose-600',   bg: 'bg-rose-50',    border: 'border-rose-100',   accent: '#e11d48' },
  IMAGERIE_RADIO:      { label: 'Imagerie',        color: 'text-sky-600',    bg: 'bg-sky-50',     border: 'border-sky-100',    accent: '#0284c7' },
  NOTE_PATIENT:        { label: 'Comptes rendus',  color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-100',  accent: '#d97706' },
  AUTRE:               { label: 'Autres',          color: 'text-slate-600',  bg: 'bg-slate-50',   border: 'border-slate-100',  accent: '#475569' },
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date_desc', label: 'Plus récent' },
  { value: 'date_asc',  label: 'Plus ancien' },
  { value: 'nom',       label: 'Nom A–Z'     },
  { value: 'type',      label: 'Type'        },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getFileExt(name: string): string {
  return name?.split('.').pop()?.toUpperCase() ?? '—';
}

function sortDocs(docs: PatientDocument[], key: SortKey): PatientDocument[] {
  return [...docs].sort((a, b) => {
    if (key === 'date_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (key === 'date_asc')  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (key === 'nom')       return (a.fichierNom ?? a.titre ?? '').localeCompare(b.fichierNom ?? b.titre ?? '');
    if (key === 'type')      return a.type.localeCompare(b.type);
    return 0;
  });
}

// ─── Modal confirmation suppression ──────────────────────────────────────────
function DeleteConfirmModal({
  doc,
  onConfirm,
  onCancel,
  loading,
}: {
  doc:       PatientDocument;
  onConfirm: () => void;
  onCancel:  () => void;
  loading:   boolean;
}) {
  const name = doc.fichierNom ?? doc.titre ?? 'ce document';
  const cfg  = CATEGORY_CONFIG[doc.type] ?? CATEGORY_CONFIG.AUTRE;
  const Icon = CATEGORY_ICONS[doc.type]  ?? File;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Icône d'avertissement */}
        <div className="flex flex-col items-center pt-8 pb-4 px-6">
          <div className="relative mb-4">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
              <Trash2 size={28} className="text-red-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <AlertTriangle size={12} className="text-white" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-800 text-center">Supprimer ce document ?</p>
          <p className="text-sm text-slate-500 font-bold text-center mt-1">Cette action est irréversible.</p>
        </div>

        {/* Aperçu du doc à supprimer */}
        <div className="mx-5 mb-5 flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className={`shrink-0 w-10 h-10 ${cfg.bg} rounded-xl flex flex-col items-center justify-center border ${cfg.border}`}>
            <Icon size={14} className={cfg.color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-700 truncate">{name}</p>
            <p className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</p>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-3 px-5 pb-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-black transition-all disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-black transition-all shadow-sm shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Trash2 size={14} /> Supprimer</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Badge visibilité ─────────────────────────────────────────────────────────
function VisBadge({ vis, role }: { vis: DocumentVisibility; role?: string }) {
  if (role === 'MEDECIN') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-full border border-emerald-200">
      <Stethoscope size={8} /> Du médecin
    </span>
  );
  if (vis === 'PARTAGE') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-full border border-blue-100">
      <Users size={8} /> Partagé
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded-full border border-slate-200">
      <Lock size={8} /> Privé
    </span>
  );
}

// ─── Carte document ───────────────────────────────────────────────────────────
function DocumentCard({
  doc,
  onDelete,
  onPreview,
}: {
  doc:       PatientDocument;
  onDelete:  (doc: PatientDocument) => void;
  onPreview: (doc: PatientDocument) => void;
}) {
  const cfg     = CATEGORY_CONFIG[doc.type] ?? CATEGORY_CONFIG.AUTRE;
  const Icon    = CATEGORY_ICONS[doc.type]  ?? File;
  const name    = doc.fichierNom ?? doc.titre ?? 'Document sans nom';
  const ext     = getFileExt(name);
  const isImage = ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF'].includes(ext);

  return (
    <div className={`group relative flex items-start gap-4 p-4 bg-white rounded-2xl border ${cfg.border} hover:shadow-md transition-all duration-200 cursor-pointer`}
      onClick={() => onPreview(doc)}
    >
      {/* Icône */}
      <div className={`relative shrink-0 w-12 h-12 ${cfg.bg} rounded-xl flex flex-col items-center justify-center border ${cfg.border}`}>
        <Icon size={16} className={cfg.color} />
        <span className={`text-[7px] font-black mt-0.5 ${cfg.color}`}>{ext}</span>
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <p className="font-black text-slate-800 text-sm truncate pr-2">{name}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
          <VisBadge vis={doc.visibility} role={doc.createurRole} />
          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
            <Calendar size={8} /> {fmtDateLong(doc.createdAt)}
          </span>

        </div>
        {doc.description && (
          <p className="text-[10px] text-slate-400 mt-1 truncate">{doc.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all"
        onClick={e => e.stopPropagation()}
      >
        {doc.url && (
          <a href={doc.url} target="_blank" rel="noreferrer" download
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
            title="Télécharger"
          >
            <Download size={14} />
          </a>
        )}
        {doc.url && (
          <a href={doc.url} target="_blank" rel="noreferrer"
            className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"
            title="Ouvrir"
          >
            <ExternalLink size={14} />
          </a>
        )}
        {doc.createurRole === 'PATIENT' && (
          <button
            onClick={() => onDelete(doc)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Modal aperçu ─────────────────────────────────────────────────────────────
function PreviewModal({ doc, onClose }: { doc: PatientDocument; onClose: () => void }) {
  const name = doc.fichierNom ?? doc.titre ?? 'Document';
  const ext  = getFileExt(name);
  const isImage = ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF'].includes(ext);
  const isPdf   = ext === 'PDF';
  const cfg     = CATEGORY_CONFIG[doc.type] ?? CATEGORY_CONFIG.AUTRE;
  const Icon    = CATEGORY_ICONS[doc.type]  ?? File;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header modal */}
        <div className="flex items-center gap-3 p-5 border-b border-slate-100">
          <div className={`p-2.5 ${cfg.bg} rounded-xl`}>
            <Icon size={16} className={cfg.color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-slate-800 truncate">{name}</p>
            <p className="text-[10px] text-slate-400 font-bold">{cfg.label} · {fmtDateLong(doc.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            {doc.url && (
              <a href={doc.url} target="_blank" rel="noreferrer" download
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black hover:bg-emerald-100 border border-emerald-100 transition-all"
              >
                <Download size={12} /> Télécharger
              </a>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Contenu aperçu */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4">
          {!doc.url ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <File size={40} className="mb-2 opacity-30" />
              <p className="text-sm font-bold">Aperçu non disponible</p>
            </div>
          ) : isImage ? (
            <img src={doc.url} alt={name} className="max-w-full mx-auto rounded-xl shadow-sm" />
          ) : isPdf ? (
            <iframe src={doc.url} className="w-full h-[500px] rounded-xl border border-slate-200" />
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <FileText size={40} className="mb-2 opacity-30" />
              <p className="text-sm font-bold">Ce type de fichier ne peut pas être prévisualisé</p>
              <a href={doc.url} target="_blank" rel="noreferrer"
                className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-sky-50 text-sky-600 rounded-xl text-sm font-black hover:bg-sky-100 border border-sky-100 transition-all"
              >
                <ExternalLink size={13} /> Ouvrir dans un nouvel onglet
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Zone d'envoi au médecin ──────────────────────────────────────────────────
interface SendToDocModalProps {
  onClose:    () => void;
  onSent:     (doc: PatientDocument) => void;
  medecins:   Medecin[];
}

function SendToDocModal({ onClose, onSent, medecins }: SendToDocModalProps) {
  const [step,       setStep]       = useState<'doctor' | 'file'>(medecins.length === 1 ? 'file' : 'doctor');
  const [selectedDoc, setSelectedDoc] = useState<Medecin | null>(medecins.length === 1 ? medecins[0] : null);
  const [uploading,  setUploading]  = useState(false);
  const [category,   setCategory]   = useState<DocumentCategory>('AUTRE');
  const [message,    setMessage]    = useState('');
  const [dragOver,   setDragOver]   = useState(false);
  const [success,    setSuccess]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!selectedDoc) return;
    setUploading(true);
    try {
      const titre = file.name.replace(/\.[^/.]+$/, '');
      const doc   = await uploadDocument(file, category, titre, 'PARTAGE');
      onSent(doc);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 2000);
    } catch {
      alert('Échec de l\'envoi. Veuillez réessayer.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="p-2.5 bg-emerald-100 rounded-xl">
            <Send size={16} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-black text-slate-800">Envoyer un document</p>
            {selectedDoc && step === 'file' ? (
              <p className="text-xs font-bold mt-0.5 flex items-center gap-1.5">
                <span className="text-slate-400">Destinataire :</span>
                <span className="text-emerald-700 font-black">
                  Dr. {selectedDoc.user.prenom} {selectedDoc.user.nom}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400">{selectedDoc.specialite}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-500 font-bold mt-0.5">Choisissez le médecin destinataire</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Indicateur d'étapes (si plusieurs médecins) */}
        {medecins.length > 1 && (
          <div className="flex items-center gap-2 px-5 pt-4">
            <div className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full transition-all ${
              step === 'doctor' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                step === 'file' ? 'bg-emerald-500 text-white' : 'bg-emerald-200 text-emerald-700'
              }`}>1</span>
              Médecin
            </div>
            <div className="flex-1 h-px bg-slate-200" />
            <div className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full transition-all ${
              step === 'file' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                step === 'file' ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-500'
              }`}>2</span>
              Fichier
            </div>
          </div>
        )}

        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-emerald-600 gap-3">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={36} className="animate-bounce" />
              </div>
              <p className="font-black text-lg">Document envoyé !</p>
              <p className="text-sm text-slate-500 font-bold text-center">
                Dr. {selectedDoc?.user.prenom} {selectedDoc?.user.nom} a reçu votre document.
              </p>
            </div>

          ) : step === 'doctor' ? (
            /* ── Étape 1 : Choix du médecin ── */
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Sélectionnez un médecin ({medecins.length})
              </p>
              {medecins.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                  <Stethoscope size={32} className="opacity-30" />
                  <p className="text-sm font-bold">Aucun médecin trouvé</p>
                  <p className="text-xs text-center">Vous n'avez pas encore eu de consultation.</p>
                </div>
              ) : (
                medecins.map(med => (
                  <button key={med.id}
                    onClick={() => { setSelectedDoc(med); setStep('file'); }}
                    className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-2xl text-left transition-all group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0">
                      {med.user.prenom[0]}{med.user.nom[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">
                        Dr. {med.user.prenom} {med.user.nom}
                      </p>
                      <p className="text-xs text-slate-400 font-bold">{med.specialite}</p>
                    </div>
                    <ChevronDown size={14} className="text-slate-300 group-hover:text-emerald-400 -rotate-90 transition-all" />
                  </button>
                ))
              )}
            </div>

          ) : (
            /* ── Étape 2 : Fichier ── */
            <>
              {/* Retour si plusieurs médecins */}
              {medecins.length > 1 && (
                <button onClick={() => setStep('doctor')}
                  className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-emerald-600 transition-colors"
                >
                  <ChevronDown size={12} className="rotate-90" /> Changer de médecin
                </button>
              )}

              {/* Catégorie */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Type de document</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(CATEGORY_CONFIG) as DocumentCategory[]).map(cat => {
                    const cfg  = CATEGORY_CONFIG[cat];
                    const Icon = CATEGORY_ICONS[cat];
                    return (
                      <button key={cat}
                        onClick={() => setCategory(cat)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all text-xs font-black ${
                          category === cat
                            ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm`
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <Icon size={13} /> {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Note optionnelle */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Message (optionnel)</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Ex: Résultats d'analyse du 15 mai…"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 resize-none focus:ring-2 focus:ring-emerald-400 outline-none placeholder:text-slate-300"
                />
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e  => { e.preventDefault(); setDragOver(true);  }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => !uploading && inputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 bg-white'
                }`}
              >
                <input ref={inputRef} type="file" className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                <div className="flex flex-col items-center gap-2">
                  {uploading ? (
                    <>
                      <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-bold text-emerald-600">Envoi en cours…</p>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-emerald-50 rounded-xl">
                        <Upload size={20} className="text-emerald-500" />
                      </div>
                      <p className="text-sm font-black text-slate-600">
                        Glissez ou <span className="text-emerald-600">sélectionnez un fichier</span>
                      </p>
                      <p className="text-xs text-slate-400 font-bold">PDF, PNG, JPG, DOC · 5 Mo max</p>
                    </>
                  )}
                </div>
              </div>

              <p className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                <AlertCircle size={10} />
                Ce document sera visible par Dr. {selectedDoc?.user.prenom} {selectedDoc?.user.nom} uniquement.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Zone d'upload personnel ──────────────────────────────────────────────────
function PersonalUpload({ onUploaded }: { onUploaded: (doc: PatientDocument) => void }) {
  const [open,      setOpen]      = useState(false);
  const [uploading, setUploading] = useState(false);
  const [category,  setCategory]  = useState<DocumentCategory>('AUTRE');
  const [visibility,setVisibility]= useState<DocumentVisibility>('PRIVE');
  const [dragOver,  setDragOver]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const titre = file.name.replace(/\.[^/.]+$/, '');
      const doc   = await uploadDocument(file, category, titre, visibility);
      onUploaded(doc);
      setOpen(false);
    } catch {
      alert('Échec du téléversement.');
    } finally {
      setUploading(false);
    }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-200 hover:border-slate-300 rounded-2xl text-sm font-black text-slate-500 transition-all"
    >
      <Upload size={14} /> Ajouter un document personnel
    </button>
  );

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-slate-600">Ajouter un document</p>
        <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-all">
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Catégorie</label>
          <select value={category} onChange={e => setCategory(e.target.value as DocumentCategory)}
            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-400 outline-none"
          >
            {(Object.keys(CATEGORY_CONFIG) as DocumentCategory[]).map(c => (
              <option key={c} value={c}>{CATEGORY_CONFIG[c].label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Visibilité</label>
          <select value={visibility} onChange={e => setVisibility(e.target.value as DocumentVisibility)}
            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-400 outline-none"
          >
            <option value="PRIVE">🔒 Privé</option>
            <option value="PARTAGE">👥 Partagé</option>
          </select>
        </div>
      </div>

      <div
        onDragOver={e  => { e.preventDefault(); setDragOver(true);  }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 bg-white'
        }`}
      >
        <input ref={inputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {uploading
          ? <p className="text-sm font-bold text-emerald-600 animate-pulse">Envoi en cours…</p>
          : <p className="text-xs font-bold text-slate-500">Glissez ou <span className="text-emerald-600 font-black">cliquez</span></p>
        }
      </div>
    </div>
  );
}

// ─── Stats barre ─────────────────────────────────────────────────────────────
function StatsBar({ docs }: { docs: PatientDocument[] }) {
  const counts = (Object.keys(CATEGORY_CONFIG) as DocumentCategory[]).map(cat => ({
    cat,
    count: docs.filter(d => d.type === cat).length,
    cfg: CATEGORY_CONFIG[cat],
  })).filter(x => x.count > 0);

  if (counts.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {counts.map(({ cat, count, cfg }) => {
        const Icon = CATEGORY_ICONS[cat];
        return (
          <div key={cat} className={`flex items-center gap-2.5 p-3 ${cfg.bg} rounded-xl border ${cfg.border}`}>
            <Icon size={14} className={cfg.color} />
            <div>
              <p className={`text-base font-black leading-none ${cfg.color}`}>{count}</p>
              <p className={`text-[9px] font-bold ${cfg.color} opacity-70`}>{cfg.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── DossierTab ───────────────────────────────────────────────────────────────
interface DossierTabProps {
  documents:    PatientDocument[];
  appointments: Appointment[];
  onUpdated:    () => void;
}

export function DossierTab({ documents, appointments, onUpdated }: DossierTabProps) {
  // Dédoublonner les médecins depuis les appointments
  const medecins: Medecin[] = Object.values(
    appointments.reduce<Record<string, Medecin>>((acc, a) => {
      if (a.medecin) acc[a.medecin.id] = a.medecin;
      return acc;
    }, {})
  );
  const [search,      setSearch]      = useState('');
  const [activeType,  setActiveType]  = useState<DocumentCategory | 'ALL'>('ALL');
  const [activeVis,   setActiveVis]   = useState<'ALL' | 'mine' | 'doctor'>('ALL');
  const [sortKey,     setSortKey]     = useState<SortKey>('date_desc');
  const [sortOpen,    setSortOpen]    = useState(false);
  const [preview,     setPreview]     = useState<PatientDocument | null>(null);
  const [sendModal,   setSendModal]   = useState(false);
  const [deleteTarget,setDeleteTarget]= useState<PatientDocument | null>(null);
  const [deleting,    setDeleting]    = useState(false);
  const [localDocs,   setLocalDocs]   = useState(documents);

  // Sync parent
  const prevRef = useRef(documents);
  if (prevRef.current !== documents) { prevRef.current = documents; setLocalDocs(documents); }

  const handleUploaded = (doc: PatientDocument) => {
    setLocalDocs(prev => [doc, ...prev]);
    onUpdated();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument(deleteTarget.id);
      setLocalDocs(prev => prev.filter(d => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      alert('Impossible de supprimer.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = sortDocs(
    localDocs.filter(d => {
      const matchType = activeType === 'ALL' || d.type === activeType;
      const matchVis  = activeVis === 'ALL'
        || (activeVis === 'mine'   && d.createurRole === 'PATIENT')
        || (activeVis === 'doctor' && d.createurRole === 'MEDECIN');
      const name = (d.fichierNom ?? d.titre ?? '').toLowerCase();
      const matchQ = !search || name.includes(search.toLowerCase())
        || d.description?.toLowerCase().includes(search.toLowerCase());
      return matchType && matchVis && matchQ;
    }),
    sortKey,
  );

  const doctorDocs = filtered.filter(d => d.createurRole === 'MEDECIN');
  const myDocs     = filtered.filter(d => d.createurRole === 'PATIENT');

  return (
    <>
      <div className="space-y-4">

        {/* Barre d'actions supérieure */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
          {/* Recherche */}
          <div className="flex-1 min-w-[180px] relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un document…"
              className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-400 outline-none placeholder:text-slate-300"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Tri */}
          <div className="relative">
            <button onClick={() => setSortOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-100 transition-all"
            >
              <ArrowUpDown size={12} />
              {SORT_OPTIONS.find(s => s.value === sortKey)?.label}
              <ChevronDown size={10} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden min-w-[140px]">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value}
                    onClick={() => { setSortKey(opt.value); setSortOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all ${sortKey === opt.value ? 'bg-emerald-50 text-emerald-700 font-black' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bouton envoi médecin */}
          <button
            onClick={() => setSendModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-sm shadow-emerald-200 transition-all"
          >
            <Send size={13} /> Envoyer au médecin
          </button>
        </div>

        {/* Stats */}
        <StatsBar docs={localDocs} />

        {/* Filtres catégorie */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter size={10} /> Filtrer
          </span>
          {([['ALL', 'Tous'] as const, ...((Object.keys(CATEGORY_CONFIG) as DocumentCategory[]).map(c => [c, CATEGORY_CONFIG[c].label] as const))])
            .map(([val, label]) => {
              const isActive = activeType === val;
              const cfg = val !== 'ALL' ? CATEGORY_CONFIG[val as DocumentCategory] : null;
              return (
                <button key={val}
                  onClick={() => setActiveType(val as DocumentCategory | 'ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                    isActive
                      ? cfg ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          <div className="w-px h-4 bg-slate-200 mx-1" />
          {[
            { val: 'ALL',    label: 'Toute source' },
            { val: 'doctor', label: '🩺 Médecin'   },
            { val: 'mine',   label: '👤 Les miens'  },
          ].map(({ val, label }) => (
            <button key={val}
              onClick={() => setActiveVis(val as typeof activeVis)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                activeVis === val
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Résultats */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <FolderOpen size={44} className="opacity-30" />
            <p className="font-black text-slate-500">{search || activeType !== 'ALL' ? 'Aucun résultat' : 'Aucun document'}</p>
            <p className="text-sm font-bold text-slate-400">
              {search ? 'Essayez un autre terme de recherche.' : 'Vos documents médicaux apparaîtront ici.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Documents du médecin */}
            {doctorDocs.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 pb-1">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 px-2">
                    <Stethoscope size={10} /> Reçus de votre médecin ({doctorDocs.length})
                  </span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                {doctorDocs.map(d => (
                  <DocumentCard key={d.id} doc={d} onDelete={setDeleteTarget} onPreview={setPreview} />
                ))}
              </div>
            )}

            {/* Mes documents */}
            {myDocs.length > 0 && (
              <div className="space-y-2">
                {doctorDocs.length > 0 && (
                  <div className="flex items-center gap-2 pb-1">
                    <div className="h-px flex-1 bg-slate-100" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 px-2">
                      <FolderOpen size={10} /> Mes documents ({myDocs.length})
                    </span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                )}
                {myDocs.map(d => (
                  <DocumentCard key={d.id} doc={d} onDelete={setDeleteTarget} onPreview={setPreview} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload personnel */}
        <PersonalUpload onUploaded={handleUploaded} />
      </div>

      {/* Modals */}
      {preview      && <PreviewModal doc={preview} onClose={() => setPreview(null)} />}
      {deleteTarget && <DeleteConfirmModal doc={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />}
      {sendModal    && <SendToDocModal onClose={() => setSendModal(false)} onSent={doc => { setLocalDocs(prev => [doc, ...prev]); onUpdated(); }} medecins={medecins} />}
    </>
  );
}