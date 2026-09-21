import type { Coordinate } from "./types";

const EARTH_RADIUS_METERS = 6_371_000;

export function distanceInMeters(
  first: Coordinate,
  second: Coordinate,
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const latitude1 = toRadians(first.latitude);
  const latitude2 = toRadians(second.latitude);

  const deltaLatitude = toRadians(second.latitude - first.latitude);
  const deltaLongitude = toRadians(second.longitude - first.longitude);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitude1) *
      Math.cos(latitude2) *
      Math.sin(deltaLongitude / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}
