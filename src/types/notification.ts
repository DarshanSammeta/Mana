export type NotificationCategory = 'BOOKING' | 'PAYMENT' | 'CHAT' | 'SYSTEM' | 'REVIEW' | 'MARKETING';
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  isRead: boolean;
  link?: string;
  metadata?: any;
  createdAt: Date;
}

export interface SendNotificationParams {
  userId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  link?: string;
  metadata?: any;
}
