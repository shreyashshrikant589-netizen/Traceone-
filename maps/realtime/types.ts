import { isValidCoordinate } from "../location/coordinates";
import type { Coordinate } from "../location/types";

export type RealtimeEventType =
  | "VOLUNTEER_JOINED"
  | "VOLUNTEER_LOCATION_UPDATED"
  | "ZONE_ASSIGNED"
  | "ZONE_STARTED"
  | "ZONE_COMPLETED"
  | "SIGHTING_CREATED"
  | "EVIDENCE_UPDATED"
  | "PRIORITY_UPDATED"
  | "CASE_PUBLIC"
  | "CASE_RESOLVED";

export type RealtimeConnectionState =
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "RECONNECTING"
  | "ERROR";

export type RealtimeConnectionStatus = {
  state: RealtimeConnectionState;
  connected: boolean;
  lastEventAt?: number | null;
  retryCount: number;
};

export type VolunteerLocationRealtimePayload = Coordinate & {
  volunteerId: string;
  caseId: string;
  zoneId?: string | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
  sessionId?: string | null;
};

export type RealtimeEvent<TPayload = unknown> = {
  eventId: string;
  caseId?: string | null;
  eventType: RealtimeEventType;
  timestamp: number;
  payload: TPayload;
};

export type RealtimeReconnectConfig = {
  enabled: boolean;
  initialDelayMs: number;
  maxDelayMs: number;
  maxAttempts: number;
};

export const DEFAULT_REALTIME_RECONNECT_CONFIG: RealtimeReconnectConfig = {
  enabled: true,
  initialDelayMs: 1500,
  maxDelayMs: 30_000,
  maxAttempts: 5,
};

export function isValidRealtimeEvent<TPayload>(
  event: Partial<RealtimeEvent<TPayload>>,
): boolean {
  if (!event.eventId || !event.eventType) {
    return false;
  }

  if (typeof event.timestamp !== "number" || !Number.isFinite(event.timestamp)) {
    return false;
  }

  if (event.payload == null) {
    return false;
  }

  return true;
}

export function isDuplicateEventId(
  eventId: string,
  seenIds: Set<string>,
): boolean {
  return seenIds.has(eventId);
}

export function isStaleRealtimeEvent(
  event: Pick<RealtimeEvent, "timestamp">,
  maxAgeMs = 60_000,
): boolean {
  if (!Number.isFinite(event.timestamp)) {
    return true;
  }

  return Date.now() - event.timestamp > maxAgeMs;
}

export function isValidVolunteerLocationPayload(
  payload: Partial<VolunteerLocationRealtimePayload>,
): boolean {
  if (!payload.volunteerId || !payload.caseId) {
    return false;
  }

  if (
    typeof payload.latitude !== "number" ||
    typeof payload.longitude !== "number" ||
    typeof payload.timestamp !== "number"
  ) {
    return false;
  }

  if (!isValidCoordinate({ latitude: payload.latitude, longitude: payload.longitude })) {
    return false;
  }

  if (!Number.isFinite(payload.timestamp)) {
    return false;
  }

  if (payload.accuracy != null && (!Number.isFinite(payload.accuracy) || payload.accuracy < 0)) {
    return false;
  }

  if (payload.speed != null && (!Number.isFinite(payload.speed) || payload.speed < 0)) {
    return false;
  }

  if (
    payload.heading != null &&
    (!Number.isFinite(payload.heading) || payload.heading < 0 || payload.heading > 360)
  ) {
    return false;
  }

  return true;
}

export function computeConnectionStatus(
  connected: boolean,
  state: RealtimeConnectionState,
  lastEventAt?: number | null,
  retryCount = 0,
): RealtimeConnectionStatus {
  return {
    connected,
    state,
    lastEventAt: lastEventAt ?? null,
    retryCount,
  };
}
