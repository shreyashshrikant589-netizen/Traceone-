import type {
  LocationPermissionStatus,
  LocationProvider,
  LocationResult,
} from "./types";

export class UnavailableLocationProvider implements LocationProvider {
  async requestPermission(): Promise<LocationPermissionStatus> {
    return "UNAVAILABLE";
  }

  async getCurrentLocation(): Promise<LocationResult> {
    return {
      status: "UNAVAILABLE",
      location: null,
    };
  }
}