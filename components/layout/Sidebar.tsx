'use client';

import { LayoutDashboard, Calendar, FolderHeart, Settings, LogOut } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

// ─── Documents, Ordonnances et Mon dossier sont fusionnés en /dossier ─────────
const MENU_ITEMS = [
  { name: 'Tableau de bord', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Rendez-vous',     icon: Calendar,        path: '/rdv'       },
  { name: 'Dossier médical', icon: FolderHeart,     path: '/dossier'   },
  { name: 'Paramètres',      icon: Settings,        path: '/settings'  },
];

type SidebarProps = {
  collapsed:    boolean;
  initials:     string;
  userName:     string;
  onItemClick?: () => void;
};

export default function Sidebar({ collapsed, initials, userName, onItemClick }: SidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const navigate = (path: string) => {
    router.push(path);
    onItemClick?.();
  };

  return (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-5 py-6 border-b border-slate-100 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0">
          +
        </div>
        {!collapsed && (
          <span className="text-xl font-black text-slate-800 tracking-tighter">MyDoctor TN</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {MENU_ITEMS.map(item => {
          const isActive =
            pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.name : undefined}
              className={`w-full flex items-center gap-3 rounded-2xl transition-all text-sm font-bold ${
                collapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'
              } ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <item.icon
                size={18}
                className={isActive ? 'text-emerald-600 shrink-0' : 'text-slate-400 shrink-0'}
              />
              {!collapsed && item.name}
            </button>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className={`p-4 border-t border-slate-100 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-3">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-black text-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-800 truncate">{userName}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Patient</p>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-black text-sm mb-2">
            {initials}
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-500 transition-all text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-50 ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={14} />
          {!collapsed && 'Déconnexion'}
        </button>
      </div>
    </>
  );
}