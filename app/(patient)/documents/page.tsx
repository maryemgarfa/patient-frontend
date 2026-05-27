'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import {
  Plus, FileText, Upload, X, CheckCircle, Trash2,
  Download, Search, Eye, FlaskConical, Pill, File,
  Image as Img, Calendar, FolderOpen, Link2,
  ChevronDown, ChevronRight as ChevRight, Stethoscope
} from 'lucide-react';

type TDoc = 'ORDONNANCE' | 'ANALYSE_BIOLOGIQUE' | 'IMAGERIE_RADIO' | 'NOTE_PATIENT' | 'AUTRE';
type Doc = {
  id: string; titre: string; type: TDoc;
  description?: string; url: string; fichierNom?: string;
  createurId: string; createdAt: string; consultationId?: string;
};
type Appt = {
  id: string; date: string; motif?: string; statut: string;
  medecin: { specialite: string; user: { nom: string; prenom: string } };
  consultation?: { id: string; diagnostic?: string; prescription?: string };
};

const TC: Record<TDoc, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  NOTE_PATIENT:       { label: 'Note',            icon: <FileText size={14}/>,     bg:'bg-slate-50',   text:'text-slate-600',  border:'border-slate-200'   },
  ANALYSE_BIOLOGIQUE: { label: 'Analyse',          icon: <FlaskConical size={14}/>, bg:'bg-blue-50',    text:'text-blue-600',   border:'border-blue-200'    },
  IMAGERIE_RADIO:     { label: 'Radio/Imagerie',   icon: <Img size={14}/>,          bg:'bg-purple-50',  text:'text-purple-600', border:'border-purple-200'  },
  ORDONNANCE:         { label: 'Ordonnance',       icon: <Pill size={14}/>,         bg:'bg-emerald-50', text:'text-emerald-600',border:'border-emerald-200' },
  AUTRE:              { label: 'Autre',            icon: <File size={14}/>,         bg:'bg-amber-50',   text:'text-amber-600',  border:'border-amber-200'   },
};

const fmtDate  = (d: string) => new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
const fmtShort = (d: string) => new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'});
const isImg    = (n?: string) => n ? /\.(jpg|jpeg|png|webp)$/i.test(n) : false;
const isPdf    = (n?: string) => n ? /\.pdf$/i.test(n) : false;
const API      = 'http://localhost:3001';

export default function PatientDocuments() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TDoc|'all'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [preview, setPreview] = useState<Doc|null>(null);
  const [toast, setToast] = useState('');
  const [toastT, setToastT] = useState<'success'|'error'>('success');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [preSelectedConsult, setPreSelectedConsult] = useState('');

  const [form, setForm] = useState({
    titre: '', type: 'NOTE_PATIENT' as TDoc,
    description: '', consultationId: '',
    destination: 'general' as 'general'|'rdv',
  });
  const [file, setFile] = useState<File|null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'success'|'error'='success') => {
    setToast(msg); setToastT(type); setTimeout(()=>setToast(''), 3001);
  };

const load = async () => {
  const [dRes, aRes] = await Promise.all([
    api.get('/documents/my'),
    api.get('/appointments/my-appointments'),
  ]);
  
  setDocs(dRes.data);
  
  const rdvsTermines = aRes.data.filter((a: Appt) => a.statut === 'TERMINE');
  setAppts(rdvsTermines);
};

  useEffect(() => { load().catch(console.error).finally(()=>setLoading(false)); }, []);

  // Ouvrir le popup d'ajout pré-rempli pour une consultation
  const openAddForConsult = (consultId: string) => {
    setForm(f => ({ ...f, destination: 'rdv', consultationId: consultId }));
    setShowAdd(true);
  };

  const addDoc = async () => {
    if (!form.titre.trim()) { showToast('Le titre est obligatoire', 'error'); return; }
    if (form.destination === 'rdv' && !form.consultationId) { showToast('Sélectionnez une consultation', 'error'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('titre', form.titre);
      fd.append('type', form.type);
      if (form.description) fd.append('description', form.description);
      if (form.destination === 'rdv' && form.consultationId) fd.append('consultationId', form.consultationId);
      if (file) fd.append('fichier', file);
      await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await load();
      setShowAdd(false);
      setForm({ titre:'', type:'NOTE_PATIENT', description:'', consultationId:'', destination:'general' });
      setFile(null);
      showToast('Document ajouté');
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur upload', 'error');
    } finally { setUploading(false); }
  };

  const deleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/documents/${id}`);
      setDocs(p => p.filter(d => d.id !== id));
      showToast('Supprimé');
    } catch { showToast('Erreur suppression', 'error'); }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filtered = docs.filter(d => {
    const s = search.toLowerCase();
    return (!s || d.titre.toLowerCase().includes(s) || d.description?.toLowerCase().includes(s))
      && (filterType === 'all' || d.type === filterType);
  });

  const docsGeneral = filtered.filter(d => !d.consultationId);

  // Grouper par consultation
  const consultMap = new Map<string, { appt: Appt; docs: Doc[] }>();
  filtered.filter(d => d.consultationId).forEach(doc => {
    if (!doc.consultationId) return;
    const appt = appts.find(a => a.consultation?.id === doc.consultationId);
    if (!appt) return;
    if (!consultMap.has(doc.consultationId)) consultMap.set(doc.consultationId, { appt, docs: [] });
    consultMap.get(doc.consultationId)!.docs.push(doc);
  });

  if (loading) return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"/>
    </div>
  );

  const DocCard = ({ doc }: { doc: Doc }) => {
    const cfg = TC[doc.type];
    return (
      <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all group ${cfg.border}`}>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.text}`}>
                {cfg.icon}
              </div>
              <div className="min-w-0">
                <p className="font-black text-slate-800 text-sm truncate">{doc.titre}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                  <span className="text-[9px] font-bold text-slate-400">{fmtShort(doc.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {doc.url && (
                <button onClick={() => setPreview(doc)}
                  className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100">
                  <Eye size={12}/>
                </button>
              )}
              {doc.url && (
                <a href={`${API}${doc.url}`} download={doc.fichierNom} onClick={e=>e.stopPropagation()}
                  className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-100">
                  <Download size={12}/>
                </a>
              )}
              <button onClick={e => deleteDoc(doc.id, e)}
                className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-100">
                <Trash2 size={12}/>
              </button>
            </div>
          </div>
          {doc.description && (
            <p className="text-[11px] font-bold text-slate-500 mt-2 line-clamp-2">{doc.description}</p>
          )}
          {doc.fichierNom && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
              {isImg(doc.fichierNom) ? <Img size={10} className="text-slate-400"/> : <FileText size={10} className="text-slate-400"/>}
              <p className="text-[10px] font-bold text-slate-500 truncate flex-1">{doc.fichierNom}</p>
              {isPdf(doc.fichierNom) && <span className="text-[8px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded">PDF</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Documents médicaux</h1>
          <p className="text-slate-400 text-sm font-bold mt-0.5">
            {docs.length} document{docs.length>1?'s':''}
            {docs.filter(d=>d.consultationId).length > 0 &&
              <> · {docs.filter(d=>d.consultationId).length} liés à une consultation</>}
          </p>
        </div>
        <button onClick={() => { setForm({titre:'',type:'NOTE_PATIENT',description:'',consultationId:'',destination:'general'}); setShowAdd(true); }}
          className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-black hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all">
          <Plus size={16}/> Ajouter un document
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15}/>
          <input type="text" placeholder="Rechercher..."
            onChange={e=>setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-400 outline-none"/>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>setFilterType('all')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${filterType==='all'?'bg-slate-900 text-white':'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            Tous <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${filterType==='all'?'bg-white/20':'bg-slate-200'}`}>{docs.length}</span>
          </button>
          {(Object.entries(TC) as [TDoc,any][]).map(([t,cfg])=>{
            const count = docs.filter(d=>d.type===t).length;
            if (!count) return null;
            return (
              <button key={t} onClick={()=>setFilterType(filterType===t?'all':t)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  filterType===t?`${cfg.bg} ${cfg.text} ${cfg.border} border`:'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}>
                {cfg.icon} {cfg.label}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${filterType===t?'bg-white/60':'bg-slate-200'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 && consultMap.size === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
          <FolderOpen className="mx-auto text-slate-200 mb-4" size={48}/>
          <p className="text-slate-400 font-bold italic mb-4">Aucun document.</p>
          <button onClick={()=>setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl text-sm font-black hover:bg-emerald-700 mx-auto">
            <Plus size={14}/> Ajouter
          </button>
        </div>
      ) : (
        <div className="space-y-8">

          {/* ── Documents liés aux consultations ─────────────────────── */}
          {(consultMap.size > 0 || appts.length > 0) && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Stethoscope size={18}/>
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800">Documents de consultation</h2>
                  <p className="text-[10px] font-bold text-slate-400">
                    Liés à vos consultations médicales terminées
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Afficher TOUTES les consultations terminées (même sans document) */}
                {appts.map(appt => {
                  if (!appt.consultation?.id) return null;
                  const cId = appt.consultation.id;
                  const cDocs = docs.filter(d => d.consultationId === cId);
                  const isExp = expanded.has(cId);

                  return (
                    <div key={cId} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <button
                        onClick={() => toggleExpand(cId)}
                        className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors text-left">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black shrink-0">
                          {appt.medecin.user.prenom[0]}{appt.medecin.user.nom[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-800">Dr. {appt.medecin.user.prenom} {appt.medecin.user.nom}</p>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                              {appt.medecin.specialite.replace('_',' ')}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                              <Calendar size={9}/> {fmtShort(appt.date)}
                            </span>
                            {appt.motif && <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{appt.motif}</span>}
                          </div>
                          {appt.consultation.diagnostic && (
                            <p className="text-[10px] text-slate-500 mt-1 truncate">{appt.consultation.diagnostic}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
                            cDocs.length > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                          }`}>
                            {cDocs.length} fichier{cDocs.length>1?'s':''}
                          </span>
                          {isExp ? <ChevronDown size={16} className="text-slate-400"/> : <ChevRight size={16} className="text-slate-400"/>}
                        </div>
                      </button>

                      {isExp && (
                        <div className="px-5 pb-5 border-t border-slate-50">
                          {cDocs.length > 0 ? (
                            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {cDocs.map(doc => <DocCard key={doc.id} doc={doc}/>)}
                            </div>
                          ) : (
                            <div className="pt-4 py-6 text-center border-2 border-dashed border-slate-100 rounded-xl mt-4">
                              <p className="text-xs font-bold text-slate-400">Aucun document pour cette consultation</p>
                            </div>
                          )}
                          <button
                            onClick={() => openAddForConsult(cId)}
                            className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black hover:bg-emerald-100 border border-emerald-200 transition-all">
                            <Plus size={13}/> Ajouter un document à cette consultation
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Si pas de consultation terminée du tout */}
                {appts.length === 0 && (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                    <p className="text-sm font-bold text-slate-400 italic">
                      Aucune consultation terminée pour l'instant.
                    </p>
                    <p className="text-xs font-bold text-slate-300 mt-1">
                      Les documents de consultation apparaîtront ici après vos RDV.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Dossier général ──────────────────────────────────────── */}
          {docsGeneral.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
                  <FolderOpen size={18}/>
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800">Dossier général</h2>
                  <p className="text-[10px] font-bold text-slate-400">{docsGeneral.length} document{docsGeneral.length>1?'s':''} personnels</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {docsGeneral.map(doc => <DocCard key={doc.id} doc={doc}/>)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── POPUP AJOUT ─────────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowAdd(false); setFile(null); } }}>
          <div className="bg-white rounded-3xl w-[540px] max-w-full shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">

            <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nouveau</p>
                <h2 className="text-xl font-black text-slate-900">Ajouter un document</h2>
              </div>
              <button onClick={()=>{ setShowAdd(false); setFile(null); }}
                className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-200">
                <X size={16}/>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Destination */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Concerne...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={()=>setForm(f=>({...f,destination:'general',consultationId:''}))}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      form.destination==='general'?'border-slate-300 bg-slate-50':'border-slate-100 hover:border-slate-200'
                    }`}>
                    <FolderOpen size={18} className={`mb-2 ${form.destination==='general'?'text-slate-700':'text-slate-400'}`}/>
                    <p className={`text-sm font-black ${form.destination==='general'?'text-slate-800':'text-slate-500'}`}>Mon dossier général</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Accessible à vos médecins</p>
                  </button>
                  <button onClick={()=>setForm(f=>({...f,destination:'rdv'}))}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      form.destination==='rdv'?'border-emerald-300 bg-emerald-50':'border-slate-100 hover:border-emerald-100'
                    }`}>
                    <Link2 size={18} className={`mb-2 ${form.destination==='rdv'?'text-emerald-600':'text-slate-400'}`}/>
                    <p className={`text-sm font-black ${form.destination==='rdv'?'text-emerald-800':'text-slate-500'}`}>Une consultation</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Partagé avec le médecin</p>
                  </button>
                </div>

                {form.destination === 'rdv' && (
                  <div className="mt-3">
                    {appts.length === 0 ? (
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                        <p className="text-xs font-bold text-amber-700">
                          Aucune consultation terminée trouvée. Le médecin doit d'abord terminer la consultation.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto rounded-2xl border border-slate-100 p-2">
              {appts.map(a => {
  // On détermine si ce rendez-vous est celui sélectionné
  // On accepte soit l'ID de consultation, soit l'ID du rendez-vous comme repli
  const isSelected = (a.consultation?.id === form.consultationId) || (a.id === form.consultationId);

  return (
    <button 
      key={a.id}
      type="button"
      onClick={() => {
        // On stocke l'ID de consultation s'il existe, sinon l'ID du rendez-vous
        const targetId = a.consultation?.id || a.id;
        setForm(f => ({ ...f, consultationId: targetId }));
      }}
      // Le bouton n'est plus jamais "disabled" pour les RDV terminés
      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50' 
          : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50'
      }`}
    >
      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-black text-sm shrink-0">
        {a.medecin.user.prenom[0]}{a.medecin.user.nom[0]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-slate-800 truncate">
          Dr. {a.medecin.user.nom} — {a.medecin.specialite.replace('_',' ')}
        </p>
        <p className="text-[10px] font-bold text-slate-400">
          {fmtShort(a.date)}{a.motif ? ` · ${a.motif}` : ''}
        </p>
        {/* Indique si la fiche médicale est déjà prête ou non */}
        {!a.consultation?.id && (
          <p className="text-[9px] font-bold text-amber-600 mt-1">En attente de validation médicale</p>
        )}
      </div>
      {isSelected && (
        <CheckCircle size={15} className="text-emerald-500 shrink-0"/>
      )}
    </button>
  );
})}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(TC) as [TDoc,any][]).map(([t,cfg])=>(
                    <button key={t} onClick={()=>setForm(f=>({...f,type:t}))}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        form.type===t?`${cfg.bg} ${cfg.border}`:'border-slate-100 hover:bg-slate-50'
                      }`}>
                      <div className={`flex justify-center mb-1 ${form.type===t?cfg.text:'text-slate-400'}`}>{cfg.icon}</div>
                      <p className={`text-[10px] font-black ${form.type===t?cfg.text:'text-slate-500'}`}>{cfg.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Titre */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Titre <span className="text-red-400">*</span>
                </label>
                <input type="text" value={form.titre} onChange={e=>setForm(f=>({...f,titre:e.target.value}))}
                  placeholder="Prise de sang, Radio thorax..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-400 outline-none"/>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  {form.type==='NOTE_PATIENT'?'Contenu':'Description (optionnel)'}
                </label>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                  rows={3} placeholder={form.type==='NOTE_PATIENT'?'Symptômes, observations...':'Résumé, remarques...'}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-400 outline-none resize-none"/>
              </div>

              {/* Upload */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Fichier (PDF/image, max 5MB)</label>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e=>{
                  const f=e.target.files?.[0];
                  if(f&&f.size>5*1024*1024){showToast('Fichier trop lourd (max 5 MB)','error');return;}
                  setFile(f||null);
                }} className="hidden"/>
                {!file?(
                  <button onClick={()=>fileRef.current?.click()}
                    className="w-full py-7 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-2 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group">
                    <Upload size={22} className="text-slate-300 group-hover:text-emerald-400 transition-colors"/>
                    <p className="text-sm font-black text-slate-400">Cliquer pour uploader</p>
                    <p className="text-[10px] font-bold text-slate-300">PDF, JPG, PNG — max 5 MB</p>
                  </button>
                ):(
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <Upload size={16} className="text-emerald-600 shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-emerald-700 truncate">{file.name}</p>
                      <p className="text-[9px] font-bold text-emerald-500">{(file.size/1024).toFixed(0)} KB</p>
                    </div>
                    <button onClick={()=>{setFile(null);if(fileRef.current)fileRef.current.value='';}}
                      className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500">
                      <X size={13}/>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 pt-4 border-t border-slate-50 flex gap-3 justify-end shrink-0">
              <button onClick={()=>{setShowAdd(false);setFile(null);}}
                className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-200">Annuler</button>
              <button onClick={addDoc}
                disabled={uploading||!form.titre.trim()||(form.destination==='rdv'&&!form.consultationId)}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-black hover:bg-emerald-700 shadow-md disabled:opacity-50">
                {uploading
                  ?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Envoi...</>
                  :<><Upload size={14}/> Enregistrer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e=>{if(e.target===e.currentTarget)setPreview(null);}}>
          <div className="bg-white rounded-3xl w-[700px] max-w-full max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <p className="font-black text-slate-800">{preview.titre}</p>
                <p className="text-[10px] font-bold text-slate-400">{fmtDate(preview.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <a href={`${API}${preview.url}`} download={preview.fichierNom}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black hover:bg-blue-100">
                  <Download size={12}/> Télécharger
                </a>
                <button onClick={()=>setPreview(null)}
                  className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-200">
                  <X size={16}/>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-50 rounded-b-3xl">
              {isImg(preview.fichierNom)
                ?<img src={`${API}${preview.url}`} alt={preview.titre} className="max-w-full max-h-[68vh] rounded-xl shadow-md object-contain"/>
                :isPdf(preview.fichierNom)
                ?<iframe src={`${API}${preview.url}`} title={preview.titre} className="w-full h-[68vh] rounded-xl border border-slate-200"/>
                :<p className="text-slate-400 font-bold italic">Aperçu non disponible.</p>}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl animate-in slide-in-from-bottom-2 duration-300 text-sm font-bold ${toastT==='error'?'bg-red-600 text-white':'bg-slate-900 text-white'}`}>
          <CheckCircle size={16} className={toastT==='error'?'text-white':'text-emerald-400'}/>
          {toast}
        </div>
      )}
    </div>
  );
}