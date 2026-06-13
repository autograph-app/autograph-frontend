import { create } from 'zustand';
import { api } from '@/lib/api';

export interface InAppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  payload?: string;
  isRead: boolean;
  readAt?: string;
  createdDate: string;
}

interface NotificationState {
  notifications: InAppNotification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: InAppNotification) => void;
  incrementUnread: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/notifications', {
        params: { pageIndex: 0, pageSize: 50 },
      });
      if (response.data?.success) {
        const { items, unreadCount } = response.data.data;
        set({ notifications: items, unreadCount });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        );
        const unread = updated.filter((n) => !n.isRead).length;
        return { notifications: updated, unreadCount: unread };
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set((state) => {
        const updated = state.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        }));
        return { notifications: updated, unreadCount: 0 };
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  addNotification: (notification: InAppNotification) => {
    set((state) => {
      // Avoid duplicate notifications in state
      if (state.notifications.some((n) => n.id === notification.id)) {
        return state;
      }
      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    });
  },

  incrementUnread: () => {
    set((state) => ({ unreadCount: state.unreadCount + 1 }));
  },
}));
