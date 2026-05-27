import api from '@/lib/api';
import type { Notif } from '@/types/ui.types';

export const fetchNotifications = async (): Promise<Notif[]> => {
  const { data } = await api.get('/notifications');
  return data;
};

export const markAsRead = async (id: string): Promise<void> => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await api.patch('/notifications/read-all');
};

export const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`/notifications/${id}`);
};

export const deleteAllNotifications = async (): Promise<void> => {
  await api.delete('/notifications/all');
};