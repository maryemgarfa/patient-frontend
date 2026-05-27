// components/document/OrdonnancesTab.tsx
'use client';

import { useState } from 'react';
import { Pill, Download, Calendar, ExternalLink, FileText, Stethoscope } from 'lucide-react';
import { EmptyState, SearchBar, SectionHeader } from '@/components/ui/dossier-ui';
import { fmtDateLong, downloadOrdonnance } from '@/utils/dossier';
import type { Appointment, PatientDocument, UserProfile } from '@/types/dossier.types';

// ─── Ordonnance depuis consultation ──────────────────────────────────────────
function OrdonnanceCard({ appointment, user }: { appointment: Appointment; user: UserProfile }) {
  const { medecin, consultation, date, motif } = appointment;
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 hover:border-blue-100 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-500 shrink-0">
            <Pill size={18} />
          </div>
          <div>
            <p className="font-black text-slate-800">
              Dr. {medecin?.user?.prenom} {medecin?.user?.nom}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 flex items-center gap-1">
              {medecin?.specialite} · <Calendar size={10} className="inline" /> {fmtDateLong(date)}
            </p>
            {motif && <p className="text-xs text-slate-400 font-bold mt-0.5">{motif}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-full border border-blue-100">
            Consultation
          </span>
          <button
            onClick={() => downloadOrdonnance(appointment, user.nom, user.prenom)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black hover:bg-blue-100 border border-blue-100 transition-all"
          >
            <Download size={12} /> Télécharger
          </button>
        </div>
      </div>

      {consultation?.diagnostic && (
        <div className="mb-3 p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Stethoscope size={9} /> Diagnostic
          </p>
          <p className="text-xs font-bold text-slate-700">{consultation.diagnostic}</p>
        </div>
      )}

      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">💊 Prescription</p>
        <p className="text-sm font-bold text-slate-700 whitespace-pre-line leading-relaxed font-mono">
          {consultation?.prescription}
        </p>
      </div>
    </div>
  );
}

// ─── Ordonnance depuis document médecin ──────────────────────────────────────
function DocOrdonnanceCard({ doc }: { doc: PatientDocument }) {
  return (
    <div className="bg-white rounded-[2rem] border border-emerald-100 shadow-sm p-6 hover:border-emerald-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
            <FileText size={18} />
          </div>
          <div>
            <p className="font-black text-slate-800">{doc.titre}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              <Calendar size={10} className="inline mr-1" />
              {fmtDateLong(doc.createdAt)}
            </p>
            {doc.description && (
              <p className="text-xs text-slate-500 font-bold mt-0.5">{doc.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-full border border-emerald-100">
            Du médecin
          </span>
          {doc.url && (
            <a
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black hover:bg-emerald-100 border border-emerald-100 transition-all"
            >
              <ExternalLink size={12} /> Ouvrir
            </a>
          )}
        </div>
      </div>
      {doc.fichierNom && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <FileText size={11} className="text-slate-400 shrink-0" />
          <span className="text-[10px] font-bold text-slate-500 truncate">{doc.fichierNom}</span>
        </div>
      )}
    </div>
  );
}

// ─── OrdonnancesTab ───────────────────────────────────────────────────────────
interface OrdonnancesTabProps {
  ordonnances: Appointment[];
  documents:   PatientDocument[];
  user:        UserProfile | null;
}

export function OrdonnancesTab({ ordonnances, documents, user }: OrdonnancesTabProps) {
  const [search, setSearch] = useState('');

  // Docs de type ORDONNANCE envoyés par le médecin
  const docOrdonnances = documents.filter(
    d => d.createurRole === 'MEDECIN' && d.type === 'ORDONNANCE'
  );

  const filteredConsult = ordonnances.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.medecin?.user?.nom?.toLowerCase().includes(q)     ||
      a.medecin?.user?.prenom?.toLowerCase().includes(q)  ||
      a.medecin?.specialite?.toLowerCase().includes(q)    ||
      a.consultation?.diagnostic?.toLowerCase().includes(q)
    );
  });

  const filteredDocs = docOrdonnances.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.titre?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.fichierNom?.toLowerCase().includes(q)
    );
  });

  const total = filteredConsult.length + filteredDocs.length;

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Mes ordonnances"
        subtitle={`${total} ordonnance${total !== 1 ? 's' : ''}`}
        actions={<SearchBar value={search} onChange={setSearch} placeholder="Médecin, diagnostic…" />}
      />

      {total === 0 ? (
        <EmptyState
          icon={<Pill size={44} />}
          title={search ? 'Aucun résultat' : 'Aucune ordonnance'}
          subtitle={search ? 'Essayez un autre terme.' : 'Vos ordonnances apparaîtront ici après une consultation.'}
        />
      ) : (
        <div className="space-y-6">

          {/* Ordonnances fichiers envoyées par le médecin */}
          {filteredDocs.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                <Stethoscope size={12} />
                Fichiers d'ordonnance reçus ({filteredDocs.length})
              </p>
              {filteredDocs.map(d => (
                <DocOrdonnanceCard key={d.id} doc={d} />
              ))}
            </div>
          )}

          {/* Ordonnances générées depuis consultations */}
          {filteredConsult.length > 0 && (
            <div className="space-y-3">
              {filteredDocs.length > 0 && (
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2 pt-2">
                  <Pill size={12} />
                  Ordonnances de consultation ({filteredConsult.length})
                </p>
              )}
              {filteredConsult.map(a => (
                <OrdonnanceCard key={a.id} appointment={a} user={user!} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}