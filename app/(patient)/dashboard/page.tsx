'use client';

import { useState } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { useProfileCompletion } from '@/components/auth/ProfileCompletionStepper';
import { HeroSection, SearchBar, SpecialitesGrid, MedecinCard } from '@/components/dashboard/DashboardComponents';
import ProfileCompletionStepper from '@/components/auth/ProfileCompletionStepper';
import { BookingStepper } from '@/components/rdv/BookingStepper';
import { CheckCircle, XCircle, AlertTriangle, CalendarClock } from 'lucide-react';
import type { Medecin, Appointment } from '@/types/patient.types';
import { useRouter } from 'next/navigation';

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

  // ── Confirmation avant modification ────────────────────────────────────────
  const [confirmState, setConfirmState] = useState<{
    medecin: Medecin;
    rdv: Appointment;
  } | null>(null);

  const isRdvActive = (a: Appointment): boolean => {
    if (a.statut === 'ANNULE') return false;
    const rdvDate = new Date(a.date);
    const now = new Date();
    if (rdvDate < now) return false;
    return true;
  };

  const hasActiveRdv = (medecinId: string) =>
    appointments.some(a => a.medecin?.id === medecinId && isRdvActive(a));

  const handleBookOrModify = (m: Medecin) => {
    const rdv = appointments.find(
      a => a.medecin?.id === m.id && isRdvActive(a)
    );
    if (rdv) {
      setConfirmState({ medecin: m, rdv });
    } else {
      openBooking(m);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-black transition-all animate-in slide-in-from-top-4 duration-300 ${
          toastType === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          {toastType === 'success'
            ? <CheckCircle size={16} />
            : <XCircle size={16} />
          }
          {toast}
        </div>
      )}

      <HeroSection
        prenom={user?.prenom ?? ''}
        prochainRdv={prochainRdv}
        onRdvClick={() => {}}
      />

      <SearchBar
        searchMed={searchMed}
        showFilters={showFilters}
        selectedSpec={selectedSpec}
        selectedVille={selectedVille}
        specialites={specialites}
        villes={villes}
        onSearch={setSearchMed}
        onToggleFilters={() => setShowFilters(f => !f)}
        onSpecChange={setSelectedSpec}
        onVilleChange={setSelectedVille}
        onReset={() => { setSelectedSpec(''); setSelectedVille(''); }}
      />

      {!searchMed && !selectedSpec && !selectedVille && (
        <SpecialitesGrid
          specialites={specialites}
          medecins={medecins}
          onSelect={spec => { setSelectedSpec(spec); setShowFilters(false); }}
        />
      )}

      {filteredMedecins.length > 0 && (
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
            {filteredMedecins.length} médecin{filteredMedecins.length > 1 ? 's' : ''} trouvé{filteredMedecins.length > 1 ? 's' : ''}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMedecins.map(m => (
              <MedecinCard
                key={m.id}
                medecin={m}
                hasRdv={hasActiveRdv(m.id)}
                isLoading={bookingLoading === m.id}
                onBook={() => handleBookOrModify(m)}
                onViewProfile={() => router.push(`/medecin/${m.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {bookingMed && (
        <BookingStepper
          medecin={bookingMed}
          existingRdv={existingRdv}
          appointments={appointments}
          onClose={() => { setBookingMed(null); setExistingRdv(null); }}
          onBooked={() => {
            showToast(existingRdv ? 'Rendez-vous modifié avec succès !' : 'Rendez-vous enregistré avec succès !');
            load();
            setBookingMed(null);
            setExistingRdv(null);
          }}
        />
      )}

      {/* ── Modale de confirmation de modification ── */}
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

            <h2 className="text-base font-black text-slate-900 text-center mb-2">
              Rendez-vous existant
            </h2>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-6 flex items-start gap-3">
              <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-amber-800 leading-relaxed">
                Vous avez déjà un rendez-vous confirmé avec{' '}
                <span className="font-black">
                  Dr. {confirmState.medecin.user.prenom} {confirmState.medecin.user.nom}
                </span>
                . Voulez-vous le modifier ?
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl px-4 py-2.5 mb-6 flex items-center gap-3">
              <CheckCircle size={14} className="text-emerald-500 shrink-0" />
              <p className="text-xs font-bold text-slate-600">
                RDV actuel :{' '}
                <span className="text-slate-900 font-black">
                  {new Date(confirmState.rdv.date).toLocaleDateString('fr-FR', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                  {' à '}
                  {new Date(confirmState.rdv.date).toLocaleTimeString('fr-FR', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmState(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-200 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  const { medecin, rdv } = confirmState;
                  setConfirmState(null);
                  openBooking(medecin, rdv);
                }}
                className="flex-[2] py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-200"
              >
                <CalendarClock size={15} />
                Modifier le rendez-vous
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Profile completion stepper ── */}
      {showStepper && (
        <ProfileCompletionStepper onClose={closeStepper} />
      )}
    </div>
  );
}