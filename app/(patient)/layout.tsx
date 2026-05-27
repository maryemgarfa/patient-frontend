'use client';

import React, { useEffect, useState } from 'react';
import { Menu, ChevronLeft } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import NotifBell from '@/components/layout/NotifBell';
import ProfileCompletionStepper, { useProfileCompletion } from '@/components/auth/ProfileCompletionStepper';

const MENU_LABELS: Record<string, string> = {
  '/dashboard':   'Tableau de bord',
  '/rdv':         'Rendez-vous',
  '/dossier':     'Mon dossier',
  '/ordonnances': 'Ordonnances',
  '/documents':   'Documents',
  '/settings':    'Paramètres',
};

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [user,       setUser]       = useState<{ nom: string; prenom: string } | null>(null);
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { showStepper, closeStepper } = useProfileCompletion();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) try {
      const u = JSON.parse(stored);
      setUser({ nom: u.nom || '', prenom: u.prenom || '' });
    } catch {}
  }, []);

  const initials    = user ? `${user.prenom[0] || ''}${user.nom[0] || ''}`.toUpperCase() : '??';
  const userName    = user ? `${user.prenom} ${user.nom}` : '';
  const currentPage = MENU_LABELS[pathname] || 'Espace Patient';

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">

      {/* ── Sidebar desktop ───────────────────────────────────────────────── */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-slate-100 shadow-sm sticky top-0 h-screen transition-all duration-300 z-30 ${collapsed ? 'w-20' : 'w-64'}`}>
        <Sidebar collapsed={collapsed} initials={initials} userName={userName} />
      </aside>

      {/* ── Sidebar mobile overlay ────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col bg-white w-64 h-full shadow-2xl z-50 animate-in slide-in-from-left duration-300">
            <Sidebar
              collapsed={false}
              initials={initials}
              userName={userName}
              onItemClick={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Navbar */}
        <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(c => !c)}
              className="hidden lg:flex w-9 h-9 bg-slate-100 rounded-xl items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"
            >
              {collapsed ? <Menu size={17} /> : <ChevronLeft size={17} />}
            </button>
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-200"
            >
              <Menu size={17} />
            </button>
            <h2 className="font-black text-slate-800 text-base tracking-tight">{currentPage}</h2>
          </div>

          <div className="flex items-center gap-3">
            <NotifBell />
            <button
              onClick={() => router.push('/settings')}
              className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-black text-sm hover:bg-emerald-200 transition-all"
            >
              {initials}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* ── Profile completion stepper ────────────────────────────────────── */}
      {showStepper && (
        <ProfileCompletionStepper onClose={closeStepper} onSaved={closeStepper} />
      )}
    </div>
  );
}