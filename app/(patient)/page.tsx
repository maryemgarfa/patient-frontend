'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  Search, MapPin, Calendar, ChevronRight, ChevronLeft,
  Heart, Brain, Eye, Stethoscope, Baby, Bone,
  Activity, X, CheckCircle, BriefcaseMedical,
  AlertTriangle, Filter, Phone, Clock, ArrowRight,
  Building2, GraduationCap, Award, User, RefreshCw,
} from 'lucide-react';

import { BookingStepper, Medecin as BookingMedecin } from '@/components/rdv/BookingStepper';



// ─── Types ─────────────────────────────────────────────────────────────────────
type Medecin = {
  id: string; specialite: string;
  tarif_consultation?: number; adresseCabinet?: string;
  description?: string; experience_annees?: number;
  diplome?: string; universite?: string;
  user: { nom: string; prenom: string; ville?: string; telephone?: string; photoProfil?: string };
};
type Appointment = {
  id: string; date: string; motif?: string; statut: string;
  medecin: { id: string; specialite: string; user: { nom: string; prenom: string } };
};

// ─── Spécialités ───────────────────────────────────────────────────────────────
const SPEC_DATA: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  CARDIOLOGIE:       { label: 'Cardiologie',    icon: Heart,            color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200'    },
  NEUROLOGIE:        { label: 'Neurologie',     icon: Brain,            color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-200' },
  OPHTALMOLOGIE:     { label: 'Ophtalmologie',  icon: Eye,              color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200'   },
  MEDECINE_GENERALE: { label: 'Généraliste',    icon: Stethoscope,      color: 'text-emerald-600',bg: 'bg-emerald-50', border: 'border-emerald-200'},
  PEDIATRIE:         { label: 'Pédiatrie',      icon: Baby,             color: 'text-pink-600',   bg: 'bg-pink-50',    border: 'border-pink-200'   },
  ORTHOPEDIE:        { label: 'Orthopédie',     icon: Bone,             color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200'  },
  DERMATOLOGIE:      { label: 'Dermatologie',   icon: Activity,         color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200' },
  GYNECOLOGIE:       { label: 'Gynécologie',    icon: Heart,            color: 'text-rose-600',   bg: 'bg-rose-50',    border: 'border-rose-200'   },
  DENTISTE:          { label: 'Dentiste',       icon: BriefcaseMedical, color: 'text-cyan-600',   bg: 'bg-cyan-50',    border: 'border-cyan-200'   },
  PSYCHIATRE:        { label: 'Psychiatre',     icon: Brain,            color: 'text-indigo-600', bg: 'bg-indigo-50',  border: 'border-indigo-200' },
  NUTRITIONNISTE:    { label: 'Nutritionniste', icon: Activity,         color: 'text-lime-600',   bg: 'bg-lime-50',    border: 'border-lime-200'   },
  default:           { label: 'Médecin',        icon: Stethoscope,      color: 'text-slate-500',  bg: 'bg-slate-50',   border: 'border-slate-200'  },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function imageUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  // Si l'URL est déjà absolue (http/https), on la renvoie telle quelle
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Sinon on préfixe avec la base du backend
  return `${API_BASE}${path}`;
}


const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
const fmtTime = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const fmtLong = (d: string) => new Date(d + 'T12:00').toLocaleDateString('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
});




export default function PatientDashboard() {
  const router = useRouter();
  const [user,          setUser]          = useState<any>(null);
  const [medecins,      setMedecins]      = useState<Medecin[]>([]);
  const [appointments,  setAppointments]  = useState<Appointment[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [searchMed,     setSearchMed]     = useState('');
  const [selectedSpec,  setSelectedSpec]  = useState('');
  const [selectedVille, setSelectedVille] = useState('');
  const [showFilters,   setShowFilters]   = useState(false);
  const [dynamicSpecs,  setDynamicSpecs]  = useState<string[]>([]);
  const [profileMed,    setProfileMed]    = useState<Medecin | null>(null);

  // ─── CORRECTION : bookingMed contient maintenant le type complet avec creneaux ───
  const [bookingMed,    setBookingMed]    = useState<BookingMedecin | null>(null);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null); // stocke l'id du médecin en cours de chargement

  const [toast,      setToast]      = useState('');
  const [toastType,  setToastType]  = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg); setToastType(type); setTimeout(() => setToast(''), 3500);
  };

  const load = async () => {
    const [mRes, aRes, sRes] = await Promise.all([
    api.get('/appointments/patient/my-appointments'),
api.get('/doctors/list'),
      api.get('/users/specialties')
    ]);
    setMedecins(mRes.data);
    setAppointments(aRes.data);
    setDynamicSpecs(sRes.data);
  };

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) try { setUser(JSON.parse(stored)); } catch {}
    load().catch(console.error).finally(() => setLoading(false));
  }, []);

  const openBooking = async (m: Medecin) => {
    setBookingLoading(m.id);
    try {
      // 1. Profil complet du médecin (creneaux + disponibilites + absences)
      const profileRes  = await api.get(`/users/medecins/${m.id}`);
      const fullMedecin = profileRes.data;

      // 2. Créneaux déjà réservés (format YYYY-MM-DDTHH:mm)
      const slotsRes   = await api.get(`/appointments/medecin-slots/${m.id}`);
      const takenSlots: string[] = slotsRes.data;

      // 3. Marquer estReserve sur les créneaux correspondants
      const creneauxWithStatus = (fullMedecin.creneaux || []).map((c: any) => ({
        ...c,
        estReserve: c.estReserve || takenSlots.includes(
          new Date(c.debut).toISOString().slice(0, 16)
        ),
      }));

      // 4. Les absences sont déjà incluses dans fullMedecin.absences
      //    grâce à findMedecinWithSlots (users.service.ts).
      //    Le BookingStepper les utilise pour griser les créneaux/jours absents.
      setBookingMed({
        ...fullMedecin,
        creneaux: creneauxWithStatus,
        absences: fullMedecin.absences || [],
      });
    } catch (e) {
      showToast('Impossible de charger les disponibilités du médecin.', 'error');
    } finally {
      setBookingLoading(null);
    }
  };

  const specialites = Array.from(new Set(medecins.map(m => m.specialite))).sort();
  const villes = Array.from(new Set(medecins.map(m => m.user.ville?.trim()).filter(Boolean))).sort() as string[];

  const filteredMedecins = medecins.filter(m => {
    const s = searchMed.toLowerCase().trim();
    const matchSearch = !s || `${m.user.nom} ${m.user.prenom} ${m.specialite} ${m.user.ville || ''}`.toLowerCase().includes(s);
    const matchSpec   = !selectedSpec   || m.specialite === selectedSpec;
    const matchVille  = !selectedVille  || m.user.ville?.toLowerCase().trim() === selectedVille.toLowerCase().trim();
    return matchSearch && matchSpec && matchVille;
  });

  const prochainRdv = appointments
    .filter(a => new Date(a.date) >= new Date() && a.statut !== 'ANNULE')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  if (loading) return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="space-y-7 animate-in fade-in duration-500">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-8 rounded-3xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-24 translate-x-24"/>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"/>
        <div className="relative z-10">
          <p className="text-emerald-100/70 text-sm font-bold capitalize">
            {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
          </p>
          <h1 className="text-3xl font-black mt-1 mb-4">
            Bonjour, <span className="text-emerald-200">{user?.prenom || 'Patient'}</span> 👋
          </h1>
          {prochainRdv ? (
            <div className="inline-flex items-center gap-3 bg-white/15 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/20 cursor-pointer hover:bg-white/20 transition-all"
              onClick={() => router.push('/patient/rdv')}>
              <Calendar size={16} className="text-emerald-200"/>
              <div>
                <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">Prochain RDV</p>
                <p className="text-sm font-black">
                  {fmtDate(prochainRdv.date)} à {fmtTime(prochainRdv.date)} · Dr. {prochainRdv.medecin?.user?.nom}
                </p>
              </div>
              <ChevronRight size={14}/>
            </div>
          ) : (
            <p className="text-emerald-100/60 text-sm font-bold">Trouvez un médecin et réservez votre créneau ci-dessous.</p>
          )}
        </div>
      </div>

      {/* ── Recherche & Filtres ── */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
            <input
              value={searchMed}
              onChange={e => setSearchMed(e.target.value)}
              placeholder="Rechercher un médecin, spécialité, ville..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-emerald-300 transition-all shadow-sm placeholder:text-slate-300"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`px-4 py-3 rounded-2xl border text-sm font-black transition-all flex items-center gap-2 ${
              showFilters || selectedSpec || selectedVille
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-white border-slate-100 text-slate-500 hover:border-emerald-200'
            }`}
          >
            <Filter size={15}/> Filtres
          </button>
        </div>

        {showFilters && (
          <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Spécialité</label>
                <select
                  value={selectedSpec}
                  onChange={e => setSelectedSpec(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-emerald-300 transition-all"
                >
                  <option value="">Toutes</option>
                  {specialites.map(s => (
                    <option key={s} value={s}>{(SPEC_DATA[s] ?? SPEC_DATA.default).label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Ville</label>
                <select
                  value={selectedVille}
                  onChange={e => setSelectedVille(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-emerald-300 transition-all"
                >
                  <option value="">Toutes</option>
                  {villes.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            {(selectedSpec || selectedVille) && (
              <button
                onClick={() => { setSelectedSpec(''); setSelectedVille(''); }}
                className="text-[10px] font-black text-red-400 hover:text-red-600 flex items-center gap-1"
              >
                <X size={11}/> Effacer les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Spécialités rapides ── */}
      {!searchMed && !selectedSpec && (
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Spécialités</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {specialites.map(spec => {
              const cfg  = SPEC_DATA[spec] ?? SPEC_DATA.default;
              const Icon = cfg.icon;
              const count = medecins.filter(m => m.specialite === spec).length;
              return (
                <button key={spec} onClick={() => setSelectedSpec(spec)}
                  className="flex flex-col items-center p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-300 hover:shadow-sm group transition-all">
                  <div className={`w-10 h-10 ${cfg.bg} ${cfg.color} rounded-xl flex items-center justify-center mb-2 group-hover:bg-emerald-500 group-hover:text-white transition-colors`}>
                    <Icon size={20}/>
                  </div>
                  <span className="text-xs font-bold text-slate-700 text-center leading-tight">{cfg.label}</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-0.5">{count} médecin{count > 1 ? 's' : ''}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Liste médecins ── */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-base font-black text-slate-800">
              {selectedSpec ? (SPEC_DATA[selectedSpec] ?? SPEC_DATA.default).label : 'Tous les médecins'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400">
              {filteredMedecins.length} disponible{filteredMedecins.length > 1 ? 's' : ''}
            </p>
          </div>
          {selectedSpec && (
            <button onClick={() => setSelectedSpec('')}
              className="text-[10px] font-black text-slate-400 hover:text-slate-600 flex items-center gap-1">
              <X size={11}/> Voir tout
            </button>
          )}
        </div>

        {filteredMedecins.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <Stethoscope className="mx-auto text-slate-200 mb-3" size={36}/>
            <p className="text-slate-400 font-bold italic text-sm">Aucun médecin trouvé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMedecins.map(m => {
              const cfg    = SPEC_DATA[m.specialite] ?? SPEC_DATA.default;
              const hasRdv = appointments.some(a =>
                a.medecin.id === m.id && (a.statut === 'EN_ATTENTE' || a.statut === 'CONFIRME')
              );
              const isLoadingThis = bookingLoading === m.id;
              return (
                <div key={m.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all">
                  <div className="p-5">
                    <div className="flex items-start gap-4">

                      {/* Avatar → profil */}
                      <button onClick={() => router.push(`/patient/medecin/${m.id}`)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${cfg.bg} ${cfg.color} hover:ring-4 hover:ring-emerald-200 transition-all`}>
                        {m.user.photoProfil
                          ? <img src={imageUrl(m.user.photoProfil)} alt="" className="w-full h-full rounded-2xl object-cover"/>
                          : <>{m.user.prenom[0]}{m.user.nom[0]}</>
                        }
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {/* Nom → profil */}
                            <button onClick={() => router.push(`/patient/medecin/${m.id}`)}
                              className="font-black text-slate-800 hover:text-emerald-700 transition-colors text-left">
                              Dr. {m.user.prenom} {m.user.nom}
                            </button>
                            <p className={`text-[10px] font-bold uppercase tracking-wide mt-0.5 ${cfg.color}`}>{cfg.label}</p>
                          </div>
                          {hasRdv && (
                            <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg shrink-0">
                              RDV actif
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-2 flex-wrap text-[10px] font-bold text-slate-400">
                          {m.user.ville         && <span className="flex items-center gap-1"><MapPin size={9}/>{m.user.ville}</span>}
                          {m.experience_annees  && <span>{m.experience_annees} ans d'exp.</span>}
                          {m.tarif_consultation && <span className="font-black text-emerald-600">{String(m.tarif_consultation)} TND</span>}
                        </div>
                        {m.description && (
                          <p className="text-[10px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">{m.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                   

                      {/* ─── CORRECTION : openBooking charge les créneaux avant d'ouvrir le stepper ─── */}
                      <button
                        onClick={() => openBooking(m)}
                        disabled={isLoadingThis}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all disabled:opacity-60"
                      >
                        {isLoadingThis
                          ? <><RefreshCw size={13} className="animate-spin"/> Chargement...</>
                          : <><Calendar size={13}/> {hasRdv ? 'Modifier le RDV' : 'Prendre RDV'}</>
                        }
                      </button>

                      {m.user.telephone && (
                        <a href={`tel:${m.user.telephone}`}
                          className="flex items-center justify-center px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-100 border border-slate-100 transition-all shrink-0">
                          <Phone size={13}/>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Stepper prise de RDV ── */}
      {bookingMed && (
        <BookingStepper
          medecin={bookingMed}
          appointments={appointments}
          onClose={() => setBookingMed(null)}
          onBooked={async () => {
            setBookingMed(null);
            await load();
            showToast('Rendez-vous enregistré avec succès !');
          }}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl animate-in slide-in-from-bottom-2 duration-300 text-sm font-bold ${
          toastType === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
        }`}>
          <CheckCircle size={16} className={toastType === 'error' ? 'text-white' : 'text-emerald-400'}/>
          {toast}
        </div>
      )}
    </div>
  );
}