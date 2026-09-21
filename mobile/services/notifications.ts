export type NotificationType = 'NEW_CASE' | 'NEW_ASSIGNMENT' | 'NEW_SIGHTING' | 'HIGH_PRIORITY_ZONE' | 'VOLUNTEER_JOINED' | 'ZONE_COMPLETED' | 'POSSIBLE_MATCH' | 'PUBLIC_ESCALATION' | 'POLICE_STATUS' | 'CRITICAL_ALERT';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
};

export interface NotificationService {
  listNotifications(): Promise<AppNotification[]>;
  markNotificationRead(notificationId: string): Promise<void>;
}
