import { create } from 'zustand';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  type: 'device_status' | 'alarm' | 'sms' | 'ussd' | 'mms' | 'rcs' | 'error' | 'info';
  title: string;
  message: string;
  severity: 'error' | 'info' | 'warning' | 'critical';
  timestamp: number;
  read: boolean;
  device_group?: string;
  sitename?: string;
}

interface NotificationState {
  notifications: Notification[];
}

interface NotificationActions {
  // Notification management
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  getUnreadNotifications: () => Notification[];
  getRecentNotifications: (count?: number) => Notification[];
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // Initial state
  notifications: [],

  // Notification management
  addNotification: (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      ...notificationData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      read: false,
    };

    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 100), // Keep last 100 notifications
    }));

    // Show toast notification
    const severity = notificationData.severity;
    const toastFunction = severity === 'critical' ? toast.error :
                         severity === 'error' ? toast.error :
                         severity === 'warning' ? toast.warning :
                         toast.info;

    toastFunction(notificationData.title, {
      description: notificationData.message,
      duration: severity === 'critical' ? 0 : 5000,
    });
  },

  markNotificationAsRead: (id: string) => {
    set((state) => ({
      notifications: state.notifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      ),
    }));
  },

  markAllNotificationsAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(notification => ({ ...notification, read: true })),
    }));
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter(notification => notification.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  getUnreadNotifications: () => {
    return get().notifications.filter(notification => !notification.read);
  },

  getRecentNotifications: (count = 10) => {
    return get().notifications.slice(0, count);
  },
})); 