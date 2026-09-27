import { auditLogs } from '../data/evidenceAudit';
import { escalations } from '../data/safety';
import { notifications } from '../data/notificationsSettings';
import type { AdminNotification } from '../data/notificationsSettings';
import type { AuditLog } from '../data/evidenceAudit';
import type { Escalation } from '../data/safety';
import { mockResponse, type ApiResponse, type ServiceOptions } from './api';

export function fetchNotifications(_options?: ServiceOptions): Promise<ApiResponse<AdminNotification[]>> {
  return mockResponse(notifications);
}

export function fetchEscalations(_options?: ServiceOptions): Promise<ApiResponse<Escalation[]>> {
  return mockResponse(escalations);
}

export function fetchAuditLogs(_options?: ServiceOptions): Promise<ApiResponse<AuditLog[]>> {
  return mockResponse(auditLogs);
}
