import { distanceInMeters } from "../location/distance";
import { isValidCoordinate } from "../location/coordinates";
import type { Coordinate } from "../location/types";

export type SearchBoundaryGeometry =
  | {
      type: "Polygon";
      coordinates: Coordinate[][];
    }
  | {
      type: "Circle";
      center: Coordinate;
      radiusMeters: number;
    };

export type SearchBoundary = {
  caseId: string;
  geometry: SearchBoundaryGeometry;
  createdAt: number;
  updatedAt: number;
};

export type BoundingBox = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export function isValidSearchBoundary(boundary: Partial<SearchBoundary>): boolean {
  if (!boundary.caseId || !boundary.geometry) {
    return false;
  }

  if (typeof boundary.createdAt !== "number" || !Number.isFinite(boundary.createdAt)) {
    return false;
  }

  if (typeof boundary.updatedAt !== "number" || !Number.isFinite(boundary.updatedAt)) {
    return false;
  }

  if (boundary.geometry.type === "Polygon") {
    if (!boundary.geometry.coordinates.length) {
      return false;
    }

    return boundary.geometry.coordinates.every((ring) =>
      ring.length >= 3 && ring.every((point) => isValidCoordinate(point)),
    );
  }

  return (
    !!boundary.geometry.center &&
    isValidCoordinate(boundary.geometry.center) &&
    typeof boundary.geometry.radiusMeters === "number" &&
    Number.isFinite(boundary.geometry.radiusMeters) &&
    boundary.geometry.radiusMeters >= 0
  );
}

export function boundingBoxFromPolygon(polygon: Coordinate[][]): BoundingBox | null {
  const flattened = polygon.flat();
  if (!flattened.length) {
    return null;
  }

  return {
    north: Math.max(...flattened.map((point) => point.latitude)),
    south: Math.min(...flattened.map((point) => point.latitude)),
    east: Math.max(...flattened.map((point) => point.longitude)),
    west: Math.min(...flattened.map((point) => point.longitude)),
  };
}

export function boundingBoxFromBoundary(boundary: SearchBoundary): BoundingBox | null {
  if (boundary.geometry.type === "Polygon") {
    return boundingBoxFromPolygon(boundary.geometry.coordinates);
  }

  return {
    north: boundary.geometry.center.latitude + 0.01,
    south: boundary.geometry.center.latitude - 0.01,
    east: boundary.geometry.center.longitude + 0.01,
    west: boundary.geometry.center.longitude - 0.01,
  };
}

export function pointInPolygon(point: Coordinate, polygon: Coordinate[][]): boolean {
  if (!polygon.length) {
    return false;
  }

  const ring = polygon[0];
  if (!ring.length) {
    return false;
  }

  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].longitude;
    const yi = ring[i].latitude;
    const xj = ring[j].longitude;
    const yj = ring[j].latitude;

    const intersects =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude <
        ((xj - xi) * (point.latitude - yi)) / (yj - yi + Number.EPSILON) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function pointInBoundary(point: Coordinate, boundary: SearchBoundary): boolean {
  if (boundary.geometry.type === "Circle") {
    return distanceInMeters(point, boundary.geometry.center) <= boundary.geometry.radiusMeters;
  }

  return pointInPolygon(point, boundary.geometry.coordinates);
}

export function distanceToPolygon(point: Coordinate, polygon: Coordinate[][]): number {
  const ring = polygon[0];
  if (!ring || ring.length < 2) {
    return Number.POSITIVE_INFINITY;
  }

  if (pointInPolygon(point, polygon)) {
    return 0;
  }

  let minDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < ring.length; index += 1) {
    const start = ring[index];
    const end = ring[(index + 1) % ring.length];
    const dx = end.longitude - start.longitude;
    const dy = end.latitude - start.latitude;

    if (dx === 0 && dy === 0) {
      minDistance = Math.min(minDistance, distanceInMeters(point, start));
      continue;
    }

    const t =
      ((point.longitude - start.longitude) * dx + (point.latitude - start.latitude) * dy) /
      (dx * dx + dy * dy);

    const clampedT = Math.min(1, Math.max(0, t));
    const projected = {
      latitude: start.latitude + clampedT * dy,
      longitude: start.longitude + clampedT * dx,
    };

    minDistance = Math.min(minDistance, distanceInMeters(point, projected));
  }

  return minDistance;
}

export function distanceToBoundary(point: Coordinate, boundary: SearchBoundary): number {
  if (boundary.geometry.type === "Circle") {
    return Math.max(0, distanceInMeters(point, boundary.geometry.center) - boundary.geometry.radiusMeters);
  }

  return distanceToPolygon(point, boundary.geometry.coordinates);
}

export function boundaryToGeoJSON(boundary: SearchBoundary): Record<string, unknown> {
  if (boundary.geometry.type === "Circle") {
    return {
      type: "Feature",
      properties: {
        caseId: boundary.caseId,
        radiusMeters: boundary.geometry.radiusMeters,
      },
      geometry: {
        type: "Point",
        coordinates: [boundary.geometry.center.longitude, boundary.geometry.center.latitude],
      },
    };
  }

  return {
    type: "Feature",
    properties: {
      caseId: boundary.caseId,
    },
    geometry: {
      type: "Polygon",
      coordinates: boundary.geometry.coordinates.map((ring) => ring.map((point) => [point.longitude, point.latitude])),
    },
  };
}
