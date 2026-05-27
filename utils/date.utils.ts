// ─── Date formatting ──────────────────────────────────────────────────────────

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export const fmtShort = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR');

export const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export const fmtMonth = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

export const fmtDay = (key: string) =>
  new Date(key + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

export const fmtDateShort = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

// ─── Age calculation ──────────────────────────────────────────────────────────

export const calcAge = (d?: string | null): number | null => {
  if (!d) return null;
  const b = new Date(d);
  if (isNaN(b.getTime())) return null;
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return a;
};

// ─── Notification time ────────────────────────────────────────────────────────

export const fmtNotif = (d: string): string => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60)    return "À l'instant";
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

// ─── Image URL helper ─────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const imageUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE}${path}`;
};