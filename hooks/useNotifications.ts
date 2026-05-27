'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  fetchNotifications, markNotifRead, markAllNotifsRead,
  deleteNotif, deleteAllNotifs,
} from '@/services/patient.service';
import type { Notif } from '@/types/patient.types';

export function useNotifications() {
  const [notifs,  setNotifs]  = useState<Notif[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter,  setFilter]  = useState<'all' | 'unread'>('all');
  const ref    = useRef<HTMLDivElement>(null);
  const unread = notifs.filter(n => !n.lu).length;

  const load = useCallback(async () => {
    try { const data = await fetchNotifications(); setNotifs(data); } catch {}
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const markRead = async (id: string) => {
    await markNotifRead(id).catch(() => {});
    setNotifs(p => p.map(n => n.id === id ? { ...n, lu: true } : n));
  };

  const markAll = async () => {
    setLoading(true);
    await markAllNotifsRead().catch(() => {});
    setNotifs(p => p.map(n => ({ ...n, lu: true })));
    setLoading(false);
  };

  const remove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotif(id).catch(() => {});
    setNotifs(p => p.filter(n => n.id !== id));
  };

  const clearAll = async () => {
    await deleteAllNotifs().catch(() => {});
    setNotifs([]);
  };

  const displayed = filter === 'unread' ? notifs.filter(n => !n.lu) : notifs;

  return {
    notifs, unread, open, setOpen,
    loading, filter, setFilter,
    displayed, ref,
    markRead, markAll, remove, clearAll,
  };
}