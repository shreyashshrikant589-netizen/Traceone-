import * as Location from "expo-location";

import { isValidCoordinate } from "../coordinates";
import type { GPSLocation } from "../types";
import type {
  GPSStatus,
  LocationPermissionStatus,
  LocationProvider,
  LocationResult,
} from "./types";

function toPermissionStatus(
  status: string | null | undefined,
): LocationPermissionStatus {
  switch (status) {
    case "granted":
      return "GRANTED";
    case "denied":
    case "blocked":
    case "restricted":
      return "DENIED";
    case "undetermined":
      return "UNKNOWN";
    default:
      return "UNAVAILABLE";
  }
}

function toGPSStatus(accuracy: number | null): GPSStatus {
  if (accuracy == null || !Number.isFinite(accuracy)) {
    return "UNAVAILABLE";
  }

  return accuracy <= 20 ? "HIGH_ACCURACY" : "LOW_ACCURACY";
}

export class ExpoLocationProvider implements LocationProvider {
  async requestPermission(): Promise<LocationPermissionStatus> {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        return "UNAVAILABLE";
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      return toPermissionStatus(permission.status);
    } catch {
      return "UNAVAILABLE";
    }
  }

  async getCurrentLocation(): Promise<LocationResult> {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        return {
          status: "UNAVAILABLE",
          location: null,
        };
      }

      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        return {
          status: "UNAVAILABLE",
          location: null,
        };
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy ?? null;
      const altitude = position.coords.altitude ?? null;
      const speed = position.coords.speed ?? null;
      const heading = position.coords.heading ?? null;
      const timestamp = position.timestamp;

      if (!Number.isFinite(timestamp)) {
        return {
          status: "UNAVAILABLE",
          location: null,
        };
      }

      const coordinate = { latitude, longitude };
      if (!isValidCoordinate(coordinate)) {
        return {
          status: "UNAVAILABLE",
          location: null,
        };
      }

      const location: GPSLocation = {
        latitude,
        longitude,
        accuracy,
        altitude,
        speed,
        heading,
        timestamp,
      };

      return {
        status: toGPSStatus(accuracy),
        location,
      };
    } catch {
      return {
        status: "UNAVAILABLE",
        location: null,
      };
    }
  }
}
