import { isValidCoordinate } from '@maps/location/coordinates';
import { isValidZone, type SearchZone } from '@maps/zones/types';
import type { Coordinate } from '@maps/location/types';
import type { VolunteerLocationUpdate } from '@maps/volunteers/types';
import type { SearchZone as MobileSearchZone } from '@/types';
import type { TraceOneApi } from './api';

export type BackendGeoJSON = { type: 'Point' | 'Polygon' | 'MultiPolygon'; coordinates: unknown };
export type BackendZone = { id: string; case_id: string; name: string; description?: string | null; geometry: BackendGeoJSON; status: SearchZone['status']; priority_score?: number | null; priority_rank?: number | null; assigned_volunteer_id?: string | null; created_at: string; updated_at: string };
export type BackendVolunteerLocation = { id: string; case_id: string; volunteer_id: string; session_id: string; location: { type: 'Point'; coordinates: [number, number] }; accuracy_m?: number | null; speed?: number | null; heading?: number | null; recorded_at: string; created_at: string };

function coordinate([longitude, latitude]: [number, number]): Coordinate {
  return { latitude, longitude };
}

function geometry(value: BackendGeoJSON): SearchZone['geometry'] | null {
  if (value.type === 'Point' && Array.isArray(value.coordinates) && value.coordinates.length >= 2) {
    return { type: 'Point', coordinates: coordinate(value.coordinates as [number, number]) };
  }
  if (value.type === 'Polygon' && Array.isArray(value.coordinates)) {
    return { type: 'Polygon', coordinates: (value.coordinates as [number, number][][]).map((ring) => ring.map(coordinate)) };
  }
  if (value.type === 'MultiPolygon' && Array.isArray(value.coordinates)) {
    return { type: 'MultiPolygon', coordinates: (value.coordinates as [number, number][][][]).map((polygon) => polygon.map((ring) => ring.map(coordinate))) };
  }
  return null;
}

export function toMapZone(row: BackendZone): SearchZone | null {
  const convertedGeometry = geometry(row.geometry);
  if (!convertedGeometry) return null;
  const zone: SearchZone = { id: row.id, caseId: row.case_id, name: row.name, geometry: convertedGeometry, status: row.status, priorityScore: row.priority_score ?? 0, assignedTo: row.assigned_volunteer_id ?? null, createdAt: Date.parse(row.created_at), updatedAt: Date.parse(row.updated_at) };
  return isValidZone(zone) ? zone : null;
}

export function toMapVolunteerLocation(row: BackendVolunteerLocation): VolunteerLocationUpdate {
  const [longitude, latitude] = row.location.coordinates;
  return { latitude, longitude, volunteerId: row.volunteer_id, caseId: row.case_id, sessionId: row.session_id, zoneId: null, accuracy: row.accuracy_m ?? null, altitude: null, speed: row.speed ?? null, heading: row.heading ?? null, timestamp: Date.parse(row.recorded_at) };
}

export function toMobileZone(zone: SearchZone): MobileSearchZone {
  return { id: zone.id, caseId: zone.caseId, name: zone.name, status: zone.status === 'SEARCHED' ? 'complete' : zone.status === 'IN_PROGRESS' ? 'in-progress' : zone.status === 'ASSIGNED' ? 'assigned' : 'unassigned' };
}

export async function fetchMapZones(api: TraceOneApi, caseId: string): Promise<SearchZone[]> {
  const rows = await api.getMapZones(caseId);
  return rows.map(toMapZone).filter((zone): zone is SearchZone => zone !== null);
}

export async function fetchActiveVolunteerLocations(api: TraceOneApi, caseId: string): Promise<VolunteerLocationUpdate[]> {
  const rows = await api.getActiveVolunteerLocations(caseId);
  return rows.map(toMapVolunteerLocation).filter((location) => isValidCoordinate(location));
}
