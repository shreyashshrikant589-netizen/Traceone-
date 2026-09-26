import type { AuthSessionProvider } from "./client";
import { createApiClient } from "./client";
import type { Profile } from "../types/profile";

export type UnreadCount = { count: number };

export function createTraceOneApi(baseUrl: string, sessionProvider: AuthSessionProvider) {
  const client = createApiClient(baseUrl, sessionProvider);
  return {
    ...client,
    getProfile: () => client.get<Profile>("/api/v1/profile/me"),
    getUnreadNotificationCount: () => client.get<UnreadCount>("/api/v1/notifications/unread-count"),
    health: () => client.get<{ status: string; service: string }>("/health"),
  };
}
