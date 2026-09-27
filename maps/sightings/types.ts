import { isValidCoordinate } from "../location/coordinates";
import type { Coordinate } from "../location/types";

export type SightingStatus = "PENDING" | "VERIFIED" | "SUSPICIOUS" | "REJECTED";

export type PublicSighting = {
  id: string;
  caseId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  description: string;
  photoRef?: string | null;
  reporterId?: string | null;
  volunteerId?: string | null;
  status: SightingStatus;
  createdAt: number;
  updatedAt: number;
};

export type PublicSightingInput = {
  id?: string;
  caseId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  description: string;
  photoRef?: string | null;
  reporterId?: string | null;
  volunteerId?: string | null;
  status?: SightingStatus;
  createdAt?: number;
  updatedAt?: number;
};

export function isValidSightingStatus(status: string): boolean {
  return status === "PENDING" || status === "VERIFIED" || status === "SUSPICIOUS" || status === "REJECTED";
}

export function isValidPublicSighting(sighting: Partial<PublicSighting>): boolean {
  if (!sighting.id || !sighting.caseId) {
    return false;
  }

  if (
    typeof sighting.latitude !== "number" ||
    typeof sighting.longitude !== "number" ||
    typeof sighting.timestamp !== "number"
  ) {
    return false;
  }

  if (!isValidCoordinate({ latitude: sighting.latitude, longitude: sighting.longitude })) {
    return false;
  }

  if (!Number.isFinite(sighting.timestamp)) {
    return false;
  }

  if (typeof sighting.description !== "string" || sighting.description.trim().length === 0) {
    return false;
  }

  if (sighting.status != null && !isValidSightingStatus(sighting.status)) {
    return false;
  }

  return true;
}

export function createPublicSighting(input: PublicSightingInput): PublicSighting {
  const timestamp = input.timestamp;
  const createdAt = input.createdAt ?? Date.now();

  if (!input.caseId || !input.id) {
    throw new Error("caseId and id are required for a public sighting.");
  }

  if (!isValidCoordinate({ latitude: input.latitude, longitude: input.longitude })) {
    throw new Error("Latitude and longitude must be valid coordinates.");
  }

  if (!Number.isFinite(timestamp)) {
    throw new Error("timestamp must be a finite number.");
  }

  if (input.status && !isValidSightingStatus(input.status)) {
    throw new Error("status is not a supported sighting status.");
  }

  return {
    id: input.id,
    caseId: input.caseId,
    latitude: input.latitude,
    longitude: input.longitude,
    timestamp,
    description: input.description,
    photoRef: input.photoRef ?? null,
    reporterId: input.reporterId ?? null,
    volunteerId: input.volunteerId ?? null,
    status: input.status ?? "PENDING",
    createdAt,
    updatedAt: input.updatedAt ?? createdAt,
  };
}

export function toCoordinate(sighting: Pick<PublicSighting, "latitude" | "longitude">): Coordinate {
  return {
    latitude: sighting.latitude,
    longitude: sighting.longitude,
  };
}
