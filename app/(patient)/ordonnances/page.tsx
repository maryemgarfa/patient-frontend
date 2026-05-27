'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Pill, Download, Calendar, Search, FileText } from 'lucide-react';

type Appointment = {
  id: string; date: string; motif?: string; statut: string;
  medecin: { specialite: string; user: { nom: string; prenom: string } };
  consultation?: { diagnostic: string; prescription?: string };
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtShort = (d: string) => new Date(d).toLocaleDateString('fr-FR');

export default function PatientOrdonnances() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [user,         setUser]         = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));

    api.get('/appointments/my-appointments')
      .then(r => setAppointments(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const ordonnances = appointments
    .filter(a => a.consultation?.prescription)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(a => {
      const s = search.toLowerCase();
      return !s ||
        a.medecin?.user?.nom?.toLowerCase().includes(s) ||
        a.medecin?.specialite?.toLowerCase().includes(s) ||
        a.consultation?.diagnostic?.toLowerCase().includes(s);
    });

  const download = (a: Appointment) => {
    const txt = [
      '╔══════════════════════════════════════╗',
      '║         ORDONNANCE MÉDICALE           ║',
      '╚══════════════════════════════════════╝',
      '',
      `Date        : ${fmtDate(a.date)}`,
      `Patient     : ${user?.prenom} ${user?.nom}`,
      `Médecin     : Dr. ${a.medecin?.user?.prenom} ${a.medecin?.user?.nom}`,
      `Spécialité  : ${a.medecin?.specialite}`,
      `Motif       : ${a.motif || 'Consultation'}`,
      '',
      '── DIAGNOSTIC ──────────────────────────',
      a.consultation?.diagnostic ?? '',
      '',
      '── PRESCRIPTION ────────────────────────',
      a.consultation?.prescription ?? '',
      '',
      '════════════════════════════════════════',
      'Document généré via AloDocteur',
    ].join('\n');

    const el = document.createElement('a');
    el.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
    el.download = `ordonnance_${fmtShort(a.date).replace(/\//g, '-')}.txt`;
    el.click();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Mes ordonnances</h1>
            <p className="text-slate-400 text-sm font-bold mt-0.5">{ordonnances.length} ordonnance{ordonnances.length > 1 ? 's' : ''}</p>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input type="text" placeholder="Médecin, diagnostic..."
              onChange={e => setSearch(e.target.value)}
              className="pl-11 pr-5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-400 outline-none w-60" />
          </div>
        </div>
      </div>

      {ordonnances.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
          <Pill className="mx-auto text-slate-200 mb-4" size={48} />
          <p className="text-slate-400 font-bold italic">
            {search ? 'Aucune ordonnance pour cette recherche.' : 'Aucune ordonnance disponible.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ordonnances.map(a => (
            <div key={a.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 hover:border-blue-100 transition-all">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-500 shrink-0">
                    <Pill size={20} />
                  </div>
                  <div>
                    <p className="font-black text-slate-800">Dr. {a.medecin?.user?.prenom} {a.medecin?.user?.nom}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                      {a.medecin?.specialite} · <Calendar size={10} className="inline" /> {fmtDate(a.date)}
                    </p>
                    {a.motif && <p className="text-[10px] text-slate-400 font-bold mt-0.5">{a.motif}</p>}
                  </div>
                </div>
                <button onClick={() => download(a)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black hover:bg-blue-100 border border-blue-100 transition-all shrink-0">
                  <Download size={13} /> Télécharger
                </button>
              </div>

              {a.consultation?.diagnostic && (
                <div className="mb-3 p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Diagnostic</p>
                  <p className="text-xs font-bold text-slate-700">{a.consultation.diagnostic}</p>
                </div>
              )}

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">💊 Prescription</p>
                <p className="text-sm font-bold text-slate-700 whitespace-pre-line leading-relaxed font-mono">
                  {a.consultation?.prescription}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}