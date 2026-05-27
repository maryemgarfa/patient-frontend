// components/document/DocumentsTab.tsx
'use client';

import { useState, useRef } from 'react';
import {
  FolderOpen, Upload, Trash2, ExternalLink,
  FileText, Image, BarChart2, File, Lock, Users, Stethoscope,
} from 'lucide-react';
import { Badge, EmptyState, SearchBar, SectionHeader } from '@/components/ui/dossier-ui';
import { fmtDateLong, fmtFileSize, CATEGORY_META } from '@/utils/dossier';
import { uploadDocument, deleteDocument } from '@/services/dossier.service';
import type { PatientDocument, DocumentCategory, DocumentVisibility } from '@/types/dossier.types';

// ─── Icônes par catégorie ──────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<DocumentCategory, React.ElementType> = {
  ORDONNANCE:        FileText,
  ANALYSE_BIOLOGIQUE: BarChart2,
  IMAGERIE_RADIO:    Image,
  NOTE_PATIENT:      FileText,
  AUTRE:             File,
};

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_META) as DocumentCategory[]).map(id => ({
  id,
  label: CATEGORY_META[id].label,
}));

// ─── Visibilité meta ──────────────────────────────────────────────────────────
const VISIBILITY_META: Record<DocumentVisibility, { label: string; Icon: React.ElementType; color: string; bg: string }> = {
  PRIVE:   { label: 'Privé',          Icon: Lock,        color: 'text-slate-500',  bg: 'bg-slate-100'  },
  PARTAGE: { label: 'Partagé',        Icon: Users,       color: 'text-blue-600',   bg: 'bg-blue-50'    },
  MEDECIN: { label: 'Du médecin',     Icon: Stethoscope, color: 'text-emerald-600',bg: 'bg-emerald-50' },
};

// ─── Carte document ───────────────────────────────────────────────────────────
function DocumentCard({ doc, onDelete }: { doc: PatientDocument; onDelete: (id: string) => void }) {
  const meta    = CATEGORY_META[doc.type] ?? CATEGORY_META.AUTRE;
  const Icon    = CATEGORY_ICONS[doc.type] ?? File;
  const visMeta = VISIBILITY_META[doc.visibility] ?? VISIBILITY_META.PRIVE;
  const VisIcon = visMeta.Icon;
  const name    = doc.fichierNom ?? doc.titre;
  const isDoctorDoc = doc.createurRole === 'MEDECIN';

  return (
    <div className={`flex items-center gap-4 p-4 bg-white rounded-2xl border transition-all group ${
      isDoctorDoc
        ? 'border-emerald-100 hover:border-emerald-200 hover:shadow-sm'
        : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'
    }`}>
      <div className={`p-3 ${meta.bg} rounded-xl shrink-0`}>
        <Icon size={18} className={meta.color} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-black text-slate-800 text-sm truncate">{name}</p>
          {isDoctorDoc && (
            <span className="shrink-0 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-100">
              Du médecin
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <Badge label={meta.label} color={meta.color} bg={meta.bg} />
          <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
            <VisIcon size={10} className={visMeta.color} />
            {visMeta.label}
          </span>
          <span className="text-[10px] text-slate-400 font-bold">
            {fmtDateLong(doc.createdAt)}
          </span>
        </div>
        {doc.description && (
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{doc.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
        {doc.url && (
          <a
            href={doc.url}
            target="_blank"
            rel="noreferrer"
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title="Ouvrir"
          >
            <ExternalLink size={14} />
          </a>
        )}
        {/* Seul le créateur peut supprimer */}
        {doc.createurRole === 'PATIENT' && (
          <button
            onClick={() => onDelete(doc.id)}
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

// ─── Zone d'upload ─────────────────────────────────────────────────────────────
function UploadArea({ onUploaded }: { onUploaded: (doc: PatientDocument) => void }) {
  const [uploading,   setUploading]   = useState(false);
  const [category,    setCategory]    = useState<DocumentCategory>('AUTRE');
  const [visibility,  setVisibility]  = useState<DocumentVisibility>('PRIVE');
  const [dragOver,    setDragOver]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const titre = file.name.replace(/\.[^/.]+$/, '');
      const doc   = await uploadDocument(file, category, titre, visibility);
      onUploaded(doc);
    } catch {
      alert('Échec du téléversement. Veuillez réessayer.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-100">
      <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
        Ajouter un document
      </p>

      {/* Ligne catégorie + visibilité */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Catégorie</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as DocumentCategory)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-400 outline-none"
          >
            {CATEGORY_OPTIONS.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Visibilité</label>
          <select
            value={visibility}
            onChange={e => setVisibility(e.target.value as DocumentVisibility)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-400 outline-none"
          >
            <option value="PRIVE">🔒 Privé (moi seul)</option>
            <option value="PARTAGE">👥 Partagé avec mon médecin</option>
          </select>
        </div>
      </div>

      {/* Zone drag & drop */}
      <div
        onDragOver={e  => { e.preventDefault(); setDragOver(true);  }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-emerald-400 bg-emerald-50'
            : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 bg-white'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <Upload size={28} className="mx-auto text-slate-300 mb-2" />
        {uploading ? (
          <p className="text-sm font-bold text-emerald-600 animate-pulse">Envoi en cours…</p>
        ) : (
          <>
            <p className="text-sm font-black text-slate-600">
              Glissez un fichier ou{' '}
              <span className="text-emerald-600">cliquez pour sélectionner</span>
            </p>
            <p className="text-xs text-slate-400 font-bold mt-1">PDF, PNG, JPG, DOC · 5 Mo max</p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Chip filtre ──────────────────────────────────────────────────────────────
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
        active
          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border-transparent'
      }`}
    >
      {label}
    </button>
  );
}

// ─── DocumentsTab ─────────────────────────────────────────────────────────────
interface DocumentsTabProps {
  documents: PatientDocument[];
  onUpdated: () => void;
}

export function DocumentsTab({ documents, onUpdated }: DocumentsTabProps) {
  const [search,     setSearch]     = useState('');
  const [filterType, setFilterType] = useState<DocumentCategory | 'ALL'>('ALL');
  const [filterVis,  setFilterVis]  = useState<DocumentVisibility | 'ALL'>('ALL');
  const [localDocs,  setLocalDocs]  = useState<PatientDocument[]>(documents);

  // Sync si le parent recharge
  const prevRef = useRef(documents);
  if (prevRef.current !== documents) {
    prevRef.current = documents;
    setLocalDocs(documents);
  }

  const handleUploaded = (doc: PatientDocument) => {
    setLocalDocs(prev => [doc, ...prev]);
    onUpdated();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce document définitivement ?')) return;
    try {
      await deleteDocument(id);
      setLocalDocs(prev => prev.filter(d => d.id !== id));
    } catch {
      alert('Impossible de supprimer ce document.');
    }
  };

  const filtered = localDocs.filter(d => {
    const matchType = filterType === 'ALL' || d.type === filterType;
    const matchVis  = filterVis  === 'ALL' || d.visibility === filterVis;
    const name      = (d.fichierNom ?? d.titre ?? '').toLowerCase();
    const matchText = !search || name.includes(search.toLowerCase());
    return matchType && matchVis && matchText;
  });

  // Séparer docs reçus du médecin pour les afficher en premier
  const doctorDocs = filtered.filter(d => d.createurRole === 'MEDECIN');
  const myDocs     = filtered.filter(d => d.createurRole === 'PATIENT');

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Mes documents"
        subtitle={`${filtered.length} document${filtered.length !== 1 ? 's' : ''}`}
        actions={<SearchBar value={search} onChange={setSearch} placeholder="Nom du fichier…" />}
      />

      {/* Filtres catégorie */}
      <div className="flex flex-wrap gap-2">
        <FilterChip label="Tous" active={filterType === 'ALL'} onClick={() => setFilterType('ALL')} />
        {CATEGORY_OPTIONS.map(c => (
          <FilterChip
            key={c.id}
            label={c.label}
            active={filterType === c.id}
            onClick={() => setFilterType(c.id)}
          />
        ))}
      </div>

      {/* Filtres visibilité */}
      <div className="flex flex-wrap gap-2">
        <FilterChip label="Toute visibilité" active={filterVis === 'ALL'} onClick={() => setFilterVis('ALL')} />
        <FilterChip label="🔒 Privé"         active={filterVis === 'PRIVE'}   onClick={() => setFilterVis('PRIVE')}   />
        <FilterChip label="👥 Partagé"       active={filterVis === 'PARTAGE'} onClick={() => setFilterVis('PARTAGE')} />
        <FilterChip label="🩺 Du médecin"    active={filterVis === 'MEDECIN'} onClick={() => setFilterVis('MEDECIN')} />
      </div>

      {/* Zone d'upload */}
      <UploadArea onUploaded={handleUploaded} />

      {/* Section : docs reçus du médecin */}
      {doctorDocs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-2">
            <Stethoscope size={12} />
            Reçus de votre médecin ({doctorDocs.length})
          </p>
          {doctorDocs.map(d => (
            <DocumentCard key={d.id} doc={d} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Section : mes documents */}
      {myDocs.length > 0 && (
        <div className="space-y-2">
          {doctorDocs.length > 0 && (
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2 mt-4">
              <FolderOpen size={12} />
              Mes uploads ({myDocs.length})
            </p>
          )}
          {myDocs.map(d => (
            <DocumentCard key={d.id} doc={d} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Vide */}
      {filtered.length === 0 && (
        <EmptyState
          icon={<FolderOpen size={44} />}
          title={search || filterType !== 'ALL' ? 'Aucun résultat' : 'Aucun document'}
          subtitle="Ajoutez vos documents médicaux via la zone ci-dessus."
        />
      )}
    </div>
  );
}