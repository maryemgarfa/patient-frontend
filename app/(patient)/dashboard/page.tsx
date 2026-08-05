'use client';

import { useState, useCallback } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { useProfileCompletion } from '@/components/auth/ProfileCompletionStepper';
import { HeroSection, SearchBar, SpecialitesGrid, MedecinCard } from '@/components/dashboard/DashboardComponents';
import ProfileCompletionStepper from '@/components/auth/ProfileCompletionStepper';
import { BookingStepper } from '@/components/rdv/BookingStepper';
import ChatbotFlottant from '@/components/rdv/ChatbotFlottant';
import { CheckCircle, XCircle, AlertTriangle, CalendarClock } from 'lucide-react';
import type { Medecin, Appointment } from '@/types/patient.types';
import { useRouter } from 'next/navigation';
import { specialiteVersEnum } from '@/lib/specialiteMapping';
import { SPEC_DATA } from '@/constants/patient.config';


export default function DashboardPage() {
  const router = useRouter();
  const {
    user, medecins, filteredMedecins, appointments,
    specialites, villes, prochainRdv,
    searchMed,    setSearchMed,
    showFilters,  setShowFilters,
    selectedSpec, setSelectedSpec,
    selectedVille, setSelectedVille,
    bookingMed,   setBookingMed,
    existingRdv,  setExistingRdv,
    toast, toastType,
    showToast,
    bookingLoading, openBooking,
    load,
  } = useDashboard();

  const { showStepper, closeStepper } = useProfileCompletion();
  const stableClose = useCallback(() => closeStepper(), []); // eslint-disable-line

  const [confirmState, setConfirmState] = useState<{
    medecin: Medecin;
    rdv: Appointment;
  } | null>(null);

  // Spécialité recommandée par le chatbot (pour le bandeau dans la liste)
  const [chatbotSpec, setChatbotSpec] = useState<string | null>(null);

  const isRdvActive = (a: Appointment): boolean => {
    if (a.statut === 'ANNULE') return false;
    return new Date(a.date) > new Date();
  };

  const hasActiveRdv = (medecinId: string) =>
    appointments.some(a => a.medecin?.id === medecinId && isRdvActive(a));

  const handleBookOrModify = (m: Medecin) => {
    const rdv = appointments.find(a => a.medecin?.id === m.id && isRdvActive(a));
    if (rdv) setConfirmState({ medecin: m, rdv });
    else openBooking(m);
  };

  // Quand le chatbot recommande une spécialité
  const handleSpecialiteChoisie = (spec: string) => {
    const specEnum = specialiteVersEnum(spec);

    if (!specEnum) {
      // Spécialité non mappable (ex: "Urgences / SAMU") → pas de filtre, on affiche juste tout
      setChatbotSpec(null);
      setSelectedSpec('');
      return;
    }

    setChatbotSpec(specEnum);
    setSelectedSpec(specEnum);
    setShowFilters(false);
    setTimeout(() => {
      document.getElementById('liste-medecins')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const handleVoirToutes = () => {
    setChatbotSpec(null);
    setSelectedSpec('');
    setSelectedVille('');
    setShowFilters(false);
  };

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-black transition-all animate-in slide-in-from-top-4 duration-300 ${
          toastType === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toastType === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast}
        </div>
      )}

      {/* Hero */}
      <HeroSection
        prenom={user?.prenom ?? ''}
        prochainRdv={prochainRdv}
        onRdvClick={() => {}}
      />

      {/* Barre de recherche manuelle */}
      <SearchBar
        searchMed={searchMed} showFilters={showFilters}
        selectedSpec={selectedSpec} selectedVille={selectedVille}
        specialites={specialites} villes={villes}
        onSearch={v => { setSearchMed(v); }}
        onToggleFilters={() => setShowFilters(f => !f)}
        onSpecChange={v => { setSelectedSpec(v); setChatbotSpec(null); }}
        onVilleChange={setSelectedVille}
        onReset={() => {
          setSelectedSpec('');
          setSelectedVille('');
          setChatbotSpec(null);
        }}
      />

      {/* Grille spécialités — si pas de recherche active */}
      {!searchMed && !selectedSpec && !selectedVille && (
        <SpecialitesGrid
          specialites={specialites} medecins={medecins}
          onSelect={spec => {
            setSelectedSpec(spec);
            setChatbotSpec(null);
            setShowFilters(false);
          }}
        />
      )}

      {/* Liste médecins */}
      {(filteredMedecins.length > 0 || selectedSpec) && (
        <div id="liste-medecins">
          {/* Bandeau spécialité recommandée par le chatbot */}
          {chatbotSpec && selectedSpec === chatbotSpec && (
            <div className="flex items-center justify-between mb-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-700">
                  Recommandé par l'assistant : <span className="font-black">
  {SPEC_DATA[chatbotSpec ?? '']?.label ?? chatbotSpec}
</span>
                </span>
              </div>
              <button
                onClick={() => { setChatbotSpec(null); setSelectedSpec(''); }}
                className="text-[10px] font-black text-emerald-500 hover:text-emerald-700 transition-colors"
              >
                Voir tous
              </button>
            </div>
          )}

          {filteredMedecins.length === 0 ? (
            <div className="text-center py-12 px-6 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm font-black text-slate-600 mb-1">
Aucun médecin disponible pour "{SPEC_DATA[selectedSpec ?? '']?.label ?? selectedSpec}" pour le moment
              </p>
              <p className="text-xs font-bold text-slate-400 mb-4">
                Essayez une autre spécialité ou consultez la liste complète.
              </p>
              <button
                onClick={handleVoirToutes}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all"
              >
                Voir toutes les spécialités
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                {filteredMedecins.length} médecin{filteredMedecins.length > 1 ? 's' : ''} trouvé{filteredMedecins.length > 1 ? 's' : ''}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMedecins.map(m => (
                  <MedecinCard
                    key={m.id} medecin={m}
                    hasRdv={hasActiveRdv(m.id)} isLoading={bookingLoading === m.id}
                    onBook={() => handleBookOrModify(m)}
                    onViewProfile={() => router.push(`/medecin/${m.id}`)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Booking stepper */}
      {bookingMed && (
        <BookingStepper
          medecin={bookingMed} existingRdv={existingRdv} appointments={appointments}
          onClose={() => { setBookingMed(null); setExistingRdv(null); }}
          onBooked={() => {
            showToast(existingRdv ? 'Rendez-vous modifié avec succès !' : 'Rendez-vous enregistré avec succès !');
            load(); setBookingMed(null); setExistingRdv(null);
          }}
        />
      )}

      {/* Modal confirmation RDV existant */}
      {confirmState && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={e => { if (e.target === e.currentTarget) setConfirmState(null); }}
        >
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-7 animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                <CalendarClock size={28} className="text-amber-500" />
              </div>
            </div>
            <h2 className="text-base font-black text-slate-900 text-center mb-2">Rendez-vous existant</h2>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-6 flex items-start gap-3">
              <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-amber-800 leading-relaxed">
                Vous avez déjà un rendez-vous confirmé avec{' '}
                <span className="font-black">Dr. {confirmState.medecin.user.prenom} {confirmState.medecin.user.nom}</span>.
                Voulez-vous le modifier ?
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl px-4 py-2.5 mb-6 flex items-center gap-3">
              <CheckCircle size={14} className="text-emerald-500 shrink-0" />
              <p className="text-xs font-bold text-slate-600">
                RDV actuel :{' '}
                <span className="text-slate-900 font-black">
                  {new Date(confirmState.rdv.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {' à '}
                  {new Date(confirmState.rdv.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmState(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-200 transition-all">
                Annuler
              </button>
              <button
                onClick={() => { const { medecin, rdv } = confirmState; setConfirmState(null); openBooking(medecin, rdv); }}
                className="flex-[2] py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-200"
              >
                <CalendarClock size={15} /> Modifier le rendez-vous
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chatbot flottant bas-droite */}
      <ChatbotFlottant onSpecialiteChoisie={handleSpecialiteChoisie} />

      {showStepper && <ProfileCompletionStepper onClose={stableClose} />}
    </div>
  );
}