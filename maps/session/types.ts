import { isValidCoordinate } from "../location/coordinates";
import { distanceInMeters } from "../location/distance";
import type { Coordinate, GPSLocation } from "../location/types";

export type SearchSessionStatus =
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"
  | "REVIEW_REQUIRED";

export type SearchSession = {
  sessionId: string;
  caseId: string;
  volunteerId: string;
  zoneId?: string | null;
  startedAt: number;
  endedAt?: number | null;
  startLocation?: Coordinate | null;
  endLocation?: Coordinate | null;
  status: SearchSessionStatus;
};

export type GPSTrackPoint = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
  speed: number | null;
  heading: number | null;
};

export type SearchSessionTrack = SearchSession & {
  points: GPSTrackPoint[];
};

export function isValidSearchSession(session: Partial<SearchSession>): boolean {
  if (!session.sessionId || !session.caseId || !session.volunteerId) {
    return false;
  }

  if (typeof session.startedAt !== "number" || !Number.isFinite(session.startedAt)) {
    return false;
  }

  if (session.startLocation && !isValidCoordinate(session.startLocation)) {
    return false;
  }

  if (session.endLocation && !isValidCoordinate(session.endLocation)) {
    return false;
  }

  return true;
}

export function startSession(
  sessionId: string,
  caseId: string,
  volunteerId: string,
  startLocation?: Coordinate | null,
  zoneId?: string | null,
): SearchSession {
  return {
    sessionId,
    caseId,
    volunteerId,
    zoneId: zoneId ?? null,
    startedAt: Date.now(),
    startLocation: startLocation ?? null,
    endLocation: null,
    status: "ACTIVE",
  };
}

export function pauseSession(session: SearchSession): SearchSession {
  return {
    ...session,
    status: "PAUSED",
  };
}

export function resumeSession(session: SearchSession): SearchSession {
  return {
    ...session,
    status: "ACTIVE",
  };
}

export function completeSession(
  session: SearchSession,
  endLocation?: Coordinate | null,
): SearchSession {
  return {
    ...session,
    status: "COMPLETED",
    endedAt: Date.now(),
    endLocation: endLocation ?? session.endLocation ?? null,
  };
}

export function cancelSession(session: SearchSession): SearchSession {
  return {
    ...session,
    status: "CANCELLED",
    endedAt: Date.now(),
  };
}

export function createTrackPoint(location: GPSLocation): GPSTrackPoint {
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    timestamp: location.timestamp,
    speed: location.speed,
    heading: location.heading,
  };
}

export function sessionDurationMs(session: SearchSession): number {
  if (!Number.isFinite(session.startedAt)) {
    return 0;
  }

  const endTime = session.endedAt ?? Date.now();
  return Math.max(0, endTime - session.startedAt);
}

export function sessionDistanceMeters(points: GPSTrackPoint[]): number {
  if (points.length < 2) {
    return 0;
  }

  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    total += distanceInMeters(
      { latitude: previous.latitude, longitude: previous.longitude },
      { latitude: current.latitude, longitude: current.longitude },
    );
  }

  return total;
}

export function isValidTrackPoint(point: Partial<GPSTrackPoint>): boolean {
  if (
    typeof point.latitude !== "number" ||
    typeof point.longitude !== "number" ||
    typeof point.timestamp !== "number"
  ) {
    return false;
  }

  if (!isValidCoordinate({ latitude: point.latitude, longitude: point.longitude })) {
    return false;
  }

  if (point.speed != null && (!Number.isFinite(point.speed) || point.speed < 0)) {
    return false;
  }

  if (point.heading != null && (!Number.isFinite(point.heading) || point.heading < 0 || point.heading > 360)) {
    return false;
  }

  return true;
}
