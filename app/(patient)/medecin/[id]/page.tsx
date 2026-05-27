'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft, Award, Calendar, Clock,
  Phone, Star, CheckCircle, Shield,
  Stethoscope, Heart, MapPin,
} from 'lucide-react';
import { imageUrl } from '@/utils/date.utils';
import { SPEC_DATA, SPEC_GRADIENT } from '@/constants/patient.config';
import { BookingStepper } from '@/components/rdv/BookingStepper';
import { useDoctorProfile } from '@/hooks/useDoctorProfile';
import {
  StarRating, TabNav, TabApropos, TabAvis,
  TabGalerie, SidebarInfo, Lightbox,
} from '@/components/doctor-profile/DoctorProfileComponents';

export default function DoctorProfilePage() {
  const { id }  = useParams();
  const router  = useRouter();

  const {
    medecin, loading,
    activeTab,   setActiveTab,
    toast,       toastType,
    lightboxUrl, setLightboxUrl,
    showBooking, setShowBooking,
    showToast,
  } = useDoctorProfile(id);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  if (!medecin) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <p className="text-slate-400 font-bold text-lg">Médecin introuvable</p>
      <button onClick={() => router.back()}
        className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200">
        <ChevronLeft size={16} /> Retour
      </button>
    </div>
  );

  const cfg      = SPEC_DATA[medecin.specialite]     ?? SPEC_DATA.default;
  const gradient = SPEC_GRADIENT[medecin.specialite] ?? SPEC_GRADIENT.default;
  const avgNote  = medecin.avis?.length
    ? medecin.avis.reduce((s, a) => s + a.note, 0) / medecin.avis.length
    : null;
  const galeriePhotos = medecin.galerie ?? [];

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto">

      {/* ── Retour ── */}
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-700 transition-all mb-6">
        <ChevronLeft size={15} /> Retour aux médecins
      </button>

      {/* ── Hero card ── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">

        {/* Bannière */}
        <div className={`h-36 relative overflow-hidden ${!medecin.user.photoCouverture ? `bg-gradient-to-br ${gradient}` : ''}`}>
          {medecin.user.photoCouverture ? (
            <img src={imageUrl(medecin.user.photoCouverture)} alt="Couverture" className="w-full h-full object-cover" />
          ) : (
            <>
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
              <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-black/10 rounded-full" />
              <div className="absolute top-4 right-16 w-20 h-20 bg-white/5 rounded-full" />
            </>
          )}
          {medecin.user.photoCouverture && <div className="absolute inset-0 bg-black/20" />}
        </div>

        {/* Profil */}
        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">

            {/* Avatar */}
            <div className="shrink-0 -mt-14 relative z-10">
              <div className="w-28 h-28 rounded-[1.5rem] border-4 border-white shadow-2xl overflow-hidden bg-white">
                {medecin.user.photoProfil ? (
                  <img src={imageUrl(medecin.user.photoProfil)}
                    alt={`Dr. ${medecin.user.prenom} ${medecin.user.nom}`}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-3xl font-black bg-gradient-to-br ${gradient} text-white`}>
                    {medecin.user.prenom[0]}{medecin.user.nom[0]}
                  </div>
                )}
              </div>
              {medecin.statut_validation === 'VALIDE' && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                  <Shield size={13} className="text-white fill-white" />
                </div>
              )}
            </div>

            {/* Infos + CTA */}
            <div className="flex-1 min-w-0 pt-4 md:pt-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-black text-slate-900">
                      Dr. {medecin.user.prenom} {medecin.user.nom}
                    </h1>
                    {medecin.statut_validation === 'VALIDE' && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wide">
                        <Shield size={9} /> Vérifié
                      </span>
                    )}
                  </div>
                  <div className={`inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.color}`}>
                    <Stethoscope size={10} /> {cfg.label}
                  </div>
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    {medecin.user.ville && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <MapPin size={12} className="text-slate-400" /> {medecin.user.ville}
                      </span>
                    )}
                    {medecin.experience_annees && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Award size={12} className="text-slate-400" /> {medecin.experience_annees} ans d'exp.
                      </span>
                    )}
                    {medecin.duree_consultation && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Clock size={12} className="text-slate-400" /> {medecin.duree_consultation} min
                      </span>
                    )}
                    {avgNote !== null && (
                      <span className="flex items-center gap-1.5">
                        <StarRating note={Math.round(avgNote)} size={12} />
                        <span className="text-xs font-black text-amber-600">{avgNote.toFixed(1)}</span>
                        <span className="text-[10px] font-bold text-slate-400">({medecin.avis?.length})</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Boutons CTA */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => setShowBooking(true)}
                    className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${gradient} text-white rounded-2xl font-black text-sm shadow-lg hover:opacity-90 transition-all whitespace-nowrap`}>
                    <Calendar size={15} /> Prendre rendez-vous
                  </button>
                  {medecin.user.telephone && (
                    <a href={`tel:${medecin.user.telephone}`}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-700 rounded-2xl font-black text-sm border border-slate-200 hover:bg-slate-100 transition-all">
                      <Phone size={15} className="text-slate-400" /> {medecin.user.telephone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {[
          { icon: <Award size={18} className={cfg.color} />,                    val: medecin.experience_annees  ? `${medecin.experience_annees} ans`  : '—', label: 'Expérience',         bg: cfg.bg        },
          { icon: <Clock size={18} className="text-blue-500" />,                val: medecin.duree_consultation ? `${medecin.duree_consultation} min` : '—', label: 'Durée consultation', bg: 'bg-blue-50'  },
          { icon: <Star size={18} className="text-amber-500 fill-amber-400" />, val: avgNote !== null           ? avgNote.toFixed(1)                  : '—', label: `${medecin.avis?.length ?? 0} avis`, bg: 'bg-amber-50' },
          { icon: <Heart size={18} className="text-emerald-500" />,             val: medecin.tarif_consultation ? `${medecin.tarif_consultation} TND` : 'Sur RDV', label: 'Tarif', bg: 'bg-emerald-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4 flex items-center gap-3`}>
            <div className="shrink-0">{s.icon}</div>
            <div>
              <p className="font-black text-slate-800 text-sm leading-tight">{s.val}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Contenu principal (tabs + sidebar) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">

        {/* Colonne gauche — onglets */}
        <div className="md:col-span-2 space-y-4">
          <TabNav
            activeTab={activeTab}
            avisCount={medecin.avis?.length ?? 0}
            galerieCount={galeriePhotos.length}
            gradient={gradient}
            onTabChange={setActiveTab}
          />
          {activeTab === 'apropos' && <TabApropos medecin={medecin} />}
          {activeTab === 'avis'    && <TabAvis avis={medecin.avis ?? []} avgNote={avgNote} />}
          {activeTab === 'galerie' && <TabGalerie photos={galeriePhotos} onLightbox={setLightboxUrl} />}
        </div>

        {/* Colonne droite — sidebar */}
        <div className="space-y-4">
          <SidebarInfo medecin={medecin} gradient={gradient} />

          {/* CTA card */}
          <div className={`bg-gradient-to-br ${gradient} rounded-[2rem] p-6 text-white`}>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <Calendar size={20} className="text-white" />
            </div>
            <h3 className="font-black text-lg mb-1">Prendre RDV</h3>
            <p className="text-white/60 text-xs font-bold mb-4 leading-relaxed">
              Réservez un créneau avec Dr. {medecin.user.nom} en quelques clics.
            </p>
            <button
              onClick={() => setShowBooking(true)}
              className="w-full py-3 bg-white text-slate-900 rounded-xl font-black text-sm hover:bg-white/90 transition-all shadow-lg flex items-center justify-center gap-2">
              Réserver maintenant
            </button>
          </div>
        </div>
      </div>

      {/* ── BookingStepper ── */}
      {showBooking && (
        <BookingStepper
          medecin={{
            id:                 medecin.id,
            specialite:         medecin.specialite,
            tarif_consultation: medecin.tarif_consultation,
            duree_consultation: medecin.duree_consultation,
            adresseCabinet:     medecin.adresseCabinet,
            creneaux:           [],   // BookingStepper charge lui-même via useBookingSlots
            absences:           [],
            disponibilites:     [],
            user:               medecin.user,
          }}
          existingRdv={null}
          appointments={[]}
          onClose={() => setShowBooking(false)}
          onBooked={() => {
            setShowBooking(false);
            showToast('Rendez-vous enregistré avec succès !');
          }}
        />
      )}

      {/* ── Lightbox ── */}
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl animate-in slide-in-from-bottom-2 text-sm font-bold ${
          toastType === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
        }`}>
          <CheckCircle size={16} className={toastType === 'error' ? 'text-white' : 'text-emerald-400'} />
          {toast}
        </div>
      )}
    </div>
  );
}