import type { Coordinate } from "../location/types";
import { isValidCoordinate } from "../location/coordinates";

export type SearchRadiusStage =
  | "EVENT"
  | "VENUE_PERIMETER"
  | "ROADS_EXITS"
  | "TRANSPORT_NODES"
  | "WIDER_AREA";

export type SearchRadiusReason =
  | "ELAPSED_TIME"
  | "WITNESS_DIRECTION"
  | "RECENT_SIGHTING"
  | "EXIT_EVIDENCE"
  | "TRANSPORT_EVIDENCE"
  | "KNOWN_DESTINATION"
  | "COVERAGE_GAP"
  | "CONNECTIVITY_LIMITATION"
  | "MANUAL_REVIEW";

export type SearchRadius = {
  caseId: string;
  stage: SearchRadiusStage;
  previousRadiusMeters: number;
  newRadiusMeters: number;
  reason: SearchRadiusReason;
  recommendedBy: string | null;
  approvedBy: string | null;
  createdAt: number;
};

export type SearchRadiusHistoryEntry = SearchRadius & {
  historyId: string;
};

export type SearchRadiusUpdateInput = {
  caseId: string;
  stage: SearchRadiusStage;
  previousRadiusMeters: number;
  newRadiusMeters: number;
  reason: SearchRadiusReason;
  recommendedBy?: string | null;
  approvedBy?: string | null;
  createdAt?: number;
};

export const DEFAULT_SEARCH_RADIUS = {
  EVENT: 250,
  VENUE_PERIMETER: 500,
  ROADS_EXITS: 1_000,
  TRANSPORT_NODES: 2_500,
  WIDER_AREA: 10_000,
} as const satisfies Record<SearchRadiusStage, number>;

export function isValidSearchRadius(radiusMeters: number): boolean {
  return Number.isFinite(radiusMeters) && radiusMeters >= 0;
}

export function createSearchRadius(input: SearchRadiusUpdateInput): SearchRadius {
  if (!input.caseId) {
    throw new Error("caseId is required for a search radius record.");
  }

  if (!isValidSearchRadius(input.previousRadiusMeters) || !isValidSearchRadius(input.newRadiusMeters)) {
    throw new Error("Radius values must be finite and non-negative.");
  }

  return {
    caseId: input.caseId,
    stage: input.stage,
    previousRadiusMeters: input.previousRadiusMeters,
    newRadiusMeters: input.newRadiusMeters,
    reason: input.reason,
    recommendedBy: input.recommendedBy ?? null,
    approvedBy: input.approvedBy ?? null,
    createdAt: input.createdAt ?? Date.now(),
  };
}

export function expandSearchRadius(
  current: SearchRadius,
  nextRadiusMeters: number,
  reason: SearchRadiusReason,
  stage: SearchRadiusStage,
  recommendedBy?: string | null,
  approvedBy?: string | null,
): SearchRadius {
  return createSearchRadius({
    caseId: current.caseId,
    stage,
    previousRadiusMeters: current.newRadiusMeters,
    newRadiusMeters: nextRadiusMeters,
    reason,
    recommendedBy: recommendedBy ?? current.recommendedBy,
    approvedBy: approvedBy ?? current.approvedBy,
    createdAt: Date.now(),
  });
}

export function buildSearchRadiusHistory(
  radius: SearchRadius,
  previousHistory: SearchRadiusHistoryEntry[] = [],
): SearchRadiusHistoryEntry[] {
  return [
    ...previousHistory,
    {
      ...radius,
      historyId: `${radius.caseId}:${radius.createdAt}:${radius.stage}`,
    },
  ];
}

export function coerceOptionalSearchRadius(
  radiusMeters: number | null | undefined,
): number | null {
  if (radiusMeters == null) {
    return null;
  }

  return isValidSearchRadius(radiusMeters) ? radiusMeters : null;
}
