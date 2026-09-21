import { isValidCoordinate } from "../location/coordinates";
import type { PublicSighting, SightingStatus } from "./types";

export function isValidSightingCaseId(caseId: string): boolean {
  return typeof caseId === "string" && caseId.trim().length > 0;
}

export function isValidSightingTimestamp(timestamp: number): boolean {
  return typeof timestamp === "number" && Number.isFinite(timestamp);
}

export function isValidSightingStatusValue(status: string): status is SightingStatus {
  return (
    status === "PENDING" ||
    status === "VERIFIED" ||
    status === "SUSPICIOUS" ||
    status === "REJECTED"
  );
}

export function validatePublicSighting(sighting: Partial<PublicSighting>): boolean {
  if (!sighting.caseId || !isValidSightingCaseId(sighting.caseId)) {
    return false;
  }

  if (
    typeof sighting.latitude !== "number" ||
    typeof sighting.longitude !== "number" ||
    !isValidCoordinate({ latitude: sighting.latitude, longitude: sighting.longitude })
  ) {
    return false;
  }

  if (!isValidSightingTimestamp(sighting.timestamp ?? Number.NaN)) {
    return false;
  }

  if (sighting.status != null && !isValidSightingStatusValue(sighting.status)) {
    return false;
  }

  return true;
}
