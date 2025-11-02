// Mock notifications data storage in localStorage
import { delay } from './mock-data';
import { FormattedNotification } from '@/hooks/use-notifications';

const getMockNotifications = (userId: string): FormattedNotification[] => {
  const stored = localStorage.getItem(`mock-notifications-${userId}`);
  if (!stored) {
    // Create some default notifications
    const defaults: FormattedNotification[] = [
      {
        id: 'notif-1',
        type: 'system',
        title: 'Bienvenue sur RAKB',
        message: 'Découvrez notre sélection de véhicules disponibles à la location.',
        date: new Date().toISOString(),
        read: false,
        actionLink: '/search',
        actionText: 'Explorer les véhicules'
      }
    ];
    localStorage.setItem(`mock-notifications-${userId}`, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(stored);
};

const saveMockNotifications = (userId: string, notifications: FormattedNotification[]) => {
  localStorage.setItem(`mock-notifications-${userId}`, JSON.stringify(notifications));
};

export const mockNotificationsApi = {
  async getNotifications(userId: string): Promise<FormattedNotification[]> {
    await delay(300);
    return getMockNotifications(userId);
  },

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await delay(200);
    const notifications = getMockNotifications(userId);
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      saveMockNotifications(userId, notifications);
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    await delay(200);
    const notifications = getMockNotifications(userId);
    notifications.forEach(n => n.read = true);
    saveMockNotifications(userId, notifications);
  }
};

