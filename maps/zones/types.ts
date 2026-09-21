import { isValidCoordinate } from "../location/coordinates";
import { distanceInMeters } from "../location/distance";
import type { Coordinate } from "../location/types";
import { pointInBoundary, distanceToBoundary } from "../search/types";

export type SearchZoneStatus =
  | "UNSEARCHED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "SEARCHED"
  | "REOPEN";

export type SearchZoneGeometry =
  | {
      type: "Polygon";
      coordinates: Coordinate[][];
    }
  | {
      type: "MultiPolygon";
      coordinates: Coordinate[][][];
    }
  | {
      type: "Point";
      coordinates: Coordinate;
    };

export type SearchZone = {
  id: string;
  caseId: string;
  name: string;
  geometry: SearchZoneGeometry;
  status: SearchZoneStatus;
  priorityScore: number;
  assignedTo?: string | null;
  createdAt: number;
  updatedAt: number;
};

export type ZoneDisplayMetadata = {
  label: string;
  color: string;
  priorityLabel: string;
};

export type ZonePriorityMetadata = {
  label: string;
  color: string;
  scoreBand: string;
};

export function isValidZone(zone: Partial<SearchZone>): boolean {
  if (!zone.id || !zone.caseId || !zone.name || !zone.geometry) {
    return false;
  }

  if (typeof zone.createdAt !== "number" || !Number.isFinite(zone.createdAt)) {
    return false;
  }

  if (typeof zone.updatedAt !== "number" || !Number.isFinite(zone.updatedAt)) {
    return false;
  }

  if (typeof zone.priorityScore !== "number" || !Number.isFinite(zone.priorityScore)) {
    return false;
  }

  if (zone.geometry.type === "Point") {
    return isValidCoordinate(zone.geometry.coordinates);
  }

  if (zone.geometry.type === "Polygon") {
    return zone.geometry.coordinates.every((ring) => ring.length >= 3 && ring.every((point) => isValidCoordinate(point)));
  }

  return zone.geometry.coordinates.every((polygon) =>
    polygon.every((ring) => ring.length >= 3 && ring.every((point) => isValidCoordinate(point))),
  );
}

export function zonePriorityMetadata(priorityScore: number): ZonePriorityMetadata {
  if (priorityScore >= 90) {
    return { label: "Critical", color: "#dc2626", scoreBand: "critical" };
  }

  if (priorityScore >= 70) {
    return { label: "High", color: "#f97316", scoreBand: "high" };
  }

  if (priorityScore >= 45) {
    return { label: "Medium", color: "#facc15", scoreBand: "medium" };
  }

  if (priorityScore >= 20) {
    return { label: "Low", color: "#3b82f6", scoreBand: "low" };
  }

  return { label: "Minimal", color: "#94a3b8", scoreBand: "minimal" };
}

export function zoneDisplayMetadata(zone: SearchZone): ZoneDisplayMetadata {
  const priority = zonePriorityMetadata(zone.priorityScore);

  return {
    label: zone.name,
    color: priority.color,
    priorityLabel: priority.label,
  };
}

export function zoneContainsPoint(zone: SearchZone, point: Coordinate): boolean {
  if (zone.geometry.type === "Point") {
    return (
      point.latitude === zone.geometry.coordinates.latitude &&
      point.longitude === zone.geometry.coordinates.longitude
    );
  }

  if (zone.geometry.type === "Polygon") {
    const boundary = {
      caseId: zone.caseId,
      geometry: { type: "Polygon", coordinates: zone.geometry.coordinates },
      createdAt: zone.createdAt,
      updatedAt: zone.updatedAt,
    };

    return pointInBoundary(point, boundary);
  }

  return zone.geometry.coordinates.some((polygon) => {
    const boundary = {
      caseId: zone.caseId,
      geometry: { type: "Polygon", coordinates: polygon },
      createdAt: zone.createdAt,
      updatedAt: zone.updatedAt,
    };

    return pointInBoundary(point, boundary);
  });
}

export function distanceToZone(zone: SearchZone, point: Coordinate): number {
  if (zone.geometry.type === "Point") {
    return distanceInMeters(point, zone.geometry.coordinates);
  }

  if (zone.geometry.type === "Polygon") {
    const boundary = {
      caseId: zone.caseId,
      geometry: { type: "Polygon", coordinates: zone.geometry.coordinates },
      createdAt: zone.createdAt,
      updatedAt: zone.updatedAt,
    };

    return distanceToBoundary(point, boundary);
  }

  const distances = zone.geometry.coordinates.map((polygon) => {
    const boundary = {
      caseId: zone.caseId,
      geometry: { type: "Polygon", coordinates: polygon },
      createdAt: zone.createdAt,
      updatedAt: zone.updatedAt,
    };

    return distanceToBoundary(point, boundary);
  });

  return Math.min(...distances);
}

export function zoneToGeoJSON(zone: SearchZone): Record<string, unknown> {
  if (zone.geometry.type === "Point") {
    return {
      type: "Feature",
      id: zone.id,
      properties: {
        caseId: zone.caseId,
        name: zone.name,
        status: zone.status,
        priorityScore: zone.priorityScore,
        assignedTo: zone.assignedTo ?? null,
      },
      geometry: {
        type: "Point",
        coordinates: [zone.geometry.coordinates.longitude, zone.geometry.coordinates.latitude],
      },
    };
  }

  if (zone.geometry.type === "Polygon") {
    return {
      type: "Feature",
      id: zone.id,
      properties: {
        caseId: zone.caseId,
        name: zone.name,
        status: zone.status,
        priorityScore: zone.priorityScore,
        assignedTo: zone.assignedTo ?? null,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          zone.geometry.coordinates.map((point) => [point.longitude, point.latitude]),
        ],
      },
    };
  }

  return {
    type: "Feature",
    id: zone.id,
    properties: {
      caseId: zone.caseId,
      name: zone.name,
      status: zone.status,
      priorityScore: zone.priorityScore,
      assignedTo: zone.assignedTo ?? null,
    },
    geometry: {
      type: "MultiPolygon",
      coordinates: zone.geometry.coordinates.map((polygon) =>
        [polygon.map((point) => [point.longitude, point.latitude])],
      ),
    },
  };
}
