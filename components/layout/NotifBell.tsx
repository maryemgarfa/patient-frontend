'use client';

import { Bell, X, CheckCheck, Trash2, Calendar, Clock, MessageCircle, BadgeCheck, XCircle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NOTIF_TYPE_CONFIG } from '@/constants/patient.config';
import { fmtNotif } from '@/utils/date.utils';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  RDV_CONFIRME:      <Calendar   size={14} />,
  RDV_ANNULE:        <XCircle    size={14} />,
  RDV_RAPPEL:        <Clock      size={14} />,
  NOUVEAU_MESSAGE:   <MessageCircle size={14} />,
  VALIDATION_COMPTE: <BadgeCheck size={14} />,
};

export default function NotifBell() {
  const n = useNotifications();

  return (
    <div className="relative" ref={n.ref}>
      <button
        onClick={() => n.setOpen(o => !o)}
        className="relative w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all border border-slate-200"
      >
        <Bell size={18} className={n.unread > 0 ? 'text-amber-500' : ''} />
        {n.unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow">
            {n.unread > 9 ? '9+' : n.unread}
          </span>
        )}
      </button>

      {n.open && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-[1.5rem] border border-slate-100 shadow-2xl z-50 flex flex-col max-h-[500px] animate-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-sm font-black text-slate-800">Notifications</h3>
              {n.unread > 0 && (
                <p className="text-[10px] font-bold text-slate-400">{n.unread} non lue{n.unread > 1 ? 's' : ''}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {n.unread > 0 && (
                <button
                  onClick={n.markAll}
                  disabled={n.loading}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black border border-slate-100 hover:bg-slate-100"
                >
                  <CheckCheck size={11} /> Tout lire
                </button>
              )}
              <button
                onClick={() => n.setOpen(false)}
                className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="px-5 pt-3 pb-2 flex gap-2 shrink-0">
            {[
              { key: 'all',    label: `Toutes (${n.notifs.length})` },
              { key: 'unread', label: `Non lues (${n.unread})`      },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => n.setFilter(f.key as 'all' | 'unread')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                  n.filter === f.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {n.displayed.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="mx-auto text-slate-200 mb-2" size={28} />
                <p className="text-sm font-bold text-slate-300 italic">
                  {n.filter === 'unread' ? 'Aucune non lue' : 'Aucune notification'}
                </p>
              </div>
            ) : n.displayed.map(notif => {
              const cfg     = notif.type ? NOTIF_TYPE_CONFIG[notif.type] : null;
              const icon    = notif.type ? TYPE_ICONS[notif.type] : null;
              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.lu && n.markRead(notif.id)}
                  className={`flex gap-3 px-5 py-4 border-b border-slate-50 last:border-0 cursor-pointer group transition-colors ${
                    notif.lu ? 'hover:bg-slate-50/50' : 'bg-blue-50/20 hover:bg-blue-50/40'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg?.color || 'text-slate-500 bg-slate-100'}`}>
                    {icon || <Bell size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-black truncate ${notif.lu ? 'text-slate-600' : 'text-slate-900'}`}>
                        {notif.titre}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!notif.lu && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                        <button
                          onClick={e => n.remove(notif.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-400"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-[9px] text-slate-300 font-bold mt-1">{fmtNotif(notif.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clear all */}
          {n.notifs.length > 0 && (
            <div className="p-4 border-t border-slate-100 shrink-0">
              <button
                onClick={n.clearAll}
                className="w-full py-2 text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors"
              >
                Effacer toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}