import type { GPSLocation } from "../types";

export type LocationPermissionStatus =
  | "GRANTED"
  | "DENIED"
  | "UNAVAILABLE"
  | "UNKNOWN";

export type GPSStatus =
  | "HIGH_ACCURACY"
  | "LOW_ACCURACY"
  | "UNAVAILABLE";

export type LocationResult = {
  status: GPSStatus;
  location: GPSLocation | null;
};

export type LocationProvider = {
  requestPermission(): Promise<LocationPermissionStatus>;
  getCurrentLocation(): Promise<LocationResult>;
};
