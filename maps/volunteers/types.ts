import { isValidCoordinate } from "../location/coordinates";
import { distanceInMeters } from "../location/distance";
import type { Coordinate } from "../location/types";

export type VolunteerLocationAccuracy =
  | "HIGH_ACCURACY"
  | "LOW_ACCURACY"
  | "UNAVAILABLE";

export type VolunteerLocationUpdate = Coordinate & {
  volunteerId: string;
  caseId: string;
  zoneId?: string | null;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
  sessionId?: string | null;
};

export type VolunteerTrackingConfig = {
  staleThresholdMs: number;
  minDistanceMeters: number;
  lowAccuracyThresholdMeters: number;
  minUpdateIntervalMs: number;
  maxSpeedMetersPerSecond: number;
};

export const DEFAULT_VOLUNTEER_TRACKING_CONFIG: VolunteerTrackingConfig = {
  staleThresholdMs: 60_000,
  minDistanceMeters: 10,
  lowAccuracyThresholdMeters: 20,
  minUpdateIntervalMs: 15_000,
  maxSpeedMetersPerSecond: 12,
};

export function classifyGPSAccuracy(
  accuracy: number | null,
  highAccuracyThresholdMeters = 20,
): VolunteerLocationAccuracy {
  if (accuracy == null || !Number.isFinite(accuracy)) {
    return "UNAVAILABLE";
  }

  return accuracy <= highAccuracyThresholdMeters
    ? "HIGH_ACCURACY"
    : "LOW_ACCURACY";
}

export function isValidVolunteerLocationUpdate(
  update: Partial<VolunteerLocationUpdate>,
): boolean {
  if (!update.volunteerId || !update.caseId) {
    return false;
  }

  if (!update.latitude || !update.longitude) {
    return false;
  }

  if (!isValidCoordinate({ latitude: update.latitude, longitude: update.longitude })) {
    return false;
  }

  if (typeof update.timestamp !== "number" || !Number.isFinite(update.timestamp)) {
    return false;
  }

  return true;
}

export function isStaleVolunteerLocation(
  timestamp: number,
  staleThresholdMs = DEFAULT_VOLUNTEER_TRACKING_CONFIG.staleThresholdMs,
): boolean {
  if (!Number.isFinite(timestamp)) {
    return true;
  }

  return Date.now() - timestamp > staleThresholdMs;
}

export function isPossibleSpeed(
  speed: number | null,
  maxSpeedMetersPerSecond = DEFAULT_VOLUNTEER_TRACKING_CONFIG.maxSpeedMetersPerSecond,
): boolean {
  if (speed == null) {
    return true;
  }

  return Number.isFinite(speed) && speed >= 0 && speed <= maxSpeedMetersPerSecond;
}

export function distanceBetweenVolunteerLocations(
  previous: Coordinate,
  current: Coordinate,
): number {
  return distanceInMeters(previous, current);
}

export function resolveCurrentZoneId(
  volunteer: VolunteerLocationUpdate,
  zoneIdOverride?: string | null,
): string | null {
  if (typeof zoneIdOverride === "string" && zoneIdOverride.trim().length > 0) {
    return zoneIdOverride;
  }

  if (typeof volunteer.zoneId === "string" && volunteer.zoneId.trim().length > 0) {
    return volunteer.zoneId;
  }

  return null;
}

export function shouldThrottleVolunteerLocation(
  update: VolunteerLocationUpdate,
  previous: VolunteerLocationUpdate | null,
  config: VolunteerTrackingConfig = DEFAULT_VOLUNTEER_TRACKING_CONFIG,
): boolean {
  if (previous) {
    const elapsedMs = update.timestamp - previous.timestamp;
    if (elapsedMs < config.minUpdateIntervalMs) {
      return true;
    }

    const distance = distanceInMeters(previous, update);
    const accuracyState = classifyGPSAccuracy(update.accuracy);

    if (accuracyState === "UNAVAILABLE") {
      return true;
    }

    if (accuracyState === "LOW_ACCURACY") {
      return distance < config.minDistanceMeters * 2;
    }

    return distance < config.minDistanceMeters;
  }

  return false;
}
