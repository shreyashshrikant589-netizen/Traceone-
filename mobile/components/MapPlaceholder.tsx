import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Hospital, MapPin, ParkingSquare, Shield, TrainFront, UserRound, Users } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, Polygon, type Region } from 'react-native-maps';

import type { Coordinate } from '@maps/location/types';
import { isValidCoordinate } from '@maps/location/coordinates';
import { type SearchZone, zonePriorityMetadata } from '@maps/zones/types';
import type { VolunteerLocationUpdate } from '@maps/volunteers/types';
import type { MapLayer } from '@/services/map';

export type EvidenceMarker = {
  id: string;
  coordinate: Coordinate;
  title?: string;
  description?: string;
  kind?: 'evidence' | 'sighting';
};

export type TraceOneMapProps = {
  layers?: MapLayer[];
  zones?: SearchZone[];
  currentLocation?: Coordinate | null;
  currentLocationAccuracy?: number | null;
  volunteerLocations?: VolunteerLocationUpdate[];
  evidenceMarkers?: EvidenceMarker[];
  selectedZoneId?: string | null;
  onSelectZone?: (zone: SearchZone) => void;
  height?: number;
  interactive?: boolean;
  initialRegion?: Region;
  showControls?: boolean;
};

const layerLabels: Record<MapLayer, string> = {
  LAST_SEEN_LOCATION: 'Last seen',
  SEARCH_BOUNDARY: 'Boundary',
  SEARCH_ZONES: 'Search zones',
  VOLUNTEER_LOCATION: 'Volunteer',
  EXITS: 'Exits',
  ROADS: 'Roads',
  PARKING: 'Parking',
  TRANSPORT_NODES: 'Transport',
  HOSPITALS: 'Hospitals',
  POLICE_STATIONS: 'Police',
  SAFE_POINTS: 'Safe points',
};

const layerIcons = {
  LAST_SEEN_LOCATION: MapPin,
  VOLUNTEER_LOCATION: UserRound,
  PARKING: ParkingSquare,
  TRANSPORT_NODES: TrainFront,
  HOSPITALS: Hospital,
  POLICE_STATIONS: Shield,
} as const;

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length < 6) return `rgba(59, 130, 246, ${alpha})`;
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function computeCentroid(points: Coordinate[]): Coordinate | null {
  if (!points.length) return null;
  let latSum = 0;
  let lonSum = 0;
  let count = 0;
  for (const pt of points) {
    if (isValidCoordinate(pt)) {
      latSum += pt.latitude;
      lonSum += pt.longitude;
      count += 1;
    }
  }
  if (count === 0) return null;
  return { latitude: latSum / count, longitude: lonSum / count };
}

export function TraceOneMap({
  layers = ['SEARCH_ZONES', 'VOLUNTEER_LOCATION'],
  zones = [],
  currentLocation,
  currentLocationAccuracy,
  volunteerLocations = [],
  evidenceMarkers = [],
  selectedZoneId,
  onSelectZone,
  height = 280,
  interactive = true,
  initialRegion,
  showControls = true,
}: TraceOneMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const [hasCenteredInitially, setHasCenteredInitially] = useState(false);

  // Filter valid zones with coordinates
  const renderableZones = useMemo(() => {
    return zones.filter((zone) => {
      if (!zone.geometry) return false;
      if (zone.geometry.type === 'Point') {
        return isValidCoordinate(zone.geometry.coordinates);
      }
      if (zone.geometry.type === 'Polygon') {
        const ring = zone.geometry.coordinates[0];
        return Array.isArray(ring) && ring.length >= 3 && ring.every(isValidCoordinate);
      }
      if (zone.geometry.type === 'MultiPolygon') {
        return (
          Array.isArray(zone.geometry.coordinates) &&
          zone.geometry.coordinates.some(
            (poly) => Array.isArray(poly[0]) && poly[0].length >= 3 && poly[0].every(isValidCoordinate),
          )
        );
      }
      return false;
    });
  }, [zones]);

  // Filter valid volunteer locations
  const validVolunteers = useMemo(() => {
    return volunteerLocations.filter((v) => isValidCoordinate({ latitude: v.latitude, longitude: v.longitude }));
  }, [volunteerLocations]);

  // Compute all points for fitting
  const allCoordinates = useMemo(() => {
    const coords: Coordinate[] = [];
    if (currentLocation && isValidCoordinate(currentLocation)) {
      coords.push(currentLocation);
    }
    for (const zone of renderableZones) {
      if (zone.geometry.type === 'Point') {
        coords.push(zone.geometry.coordinates);
      } else if (zone.geometry.type === 'Polygon') {
        coords.push(...zone.geometry.coordinates[0]);
      } else if (zone.geometry.type === 'MultiPolygon') {
        for (const poly of zone.geometry.coordinates) {
          if (poly[0]) coords.push(...poly[0]);
        }
      }
    }
    for (const vol of validVolunteers) {
      coords.push({ latitude: vol.latitude, longitude: vol.longitude });
    }
    for (const ev of evidenceMarkers) {
      if (isValidCoordinate(ev.coordinate)) coords.push(ev.coordinate);
    }
    return coords;
  }, [currentLocation, renderableZones, validVolunteers, evidenceMarkers]);

  // Default initial region
  const defaultRegion: Region = useMemo(() => {
    if (initialRegion) return initialRegion;
    if (currentLocation && isValidCoordinate(currentLocation)) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.018,
        longitudeDelta: 0.018,
      };
    }
    if (allCoordinates.length > 0) {
      const centroid = computeCentroid(allCoordinates);
      if (centroid) {
        return {
          latitude: centroid.latitude,
          longitude: centroid.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        };
      }
    }
    // Safe default: New Delhi / Gurugram coordinate range (Musa Codex demo default)
    return {
      latitude: 28.6139,
      longitude: 77.209,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [initialRegion, currentLocation, allCoordinates]);

  // Fit camera once on mount or when first coordinates arrive
  useEffect(() => {
    if (hasCenteredInitially || !mapRef.current) return;
    if (currentLocation && isValidCoordinate(currentLocation)) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        500,
      );
      setHasCenteredInitially(true);
    } else if (allCoordinates.length > 0) {
      mapRef.current.fitToCoordinates(allCoordinates, {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: true,
      });
      setHasCenteredInitially(true);
    }
  }, [hasCenteredInitially, currentLocation, allCoordinates]);

  const recenter = () => {
    if (!mapRef.current) return;
    if (currentLocation && isValidCoordinate(currentLocation)) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        },
        400,
      );
    } else if (allCoordinates.length > 0) {
      mapRef.current.fitToCoordinates(allCoordinates, {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: true,
      });
    }
  };

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-[#EAF2F4]">
      <View style={{ height }}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={defaultRegion}
          scrollEnabled={interactive}
          zoomEnabled={interactive}
          rotateEnabled={interactive}
          pitchEnabled={false}
          showsUserLocation={false}
          showsCompass={false}
        >
          {/* 1. Search Zones (Polygons & Points) */}
          {renderableZones.map((zone) => {
            const meta = zonePriorityMetadata(zone.priorityScore);
            const isSelected = selectedZoneId === zone.id;
            const strokeColor = meta.color;
            const fillColor = hexToRgba(meta.color, isSelected ? 0.38 : 0.22);

            if (zone.geometry.type === 'Polygon') {
              const ring = zone.geometry.coordinates[0];
              const centroid = computeCentroid(ring);
              return (
                <React.Fragment key={zone.id}>
                  <Polygon
                    coordinates={ring}
                    strokeColor={strokeColor}
                    fillColor={fillColor}
                    strokeWidth={isSelected ? 3 : 2}
                    tappable
                    onPress={() => onSelectZone?.(zone)}
                  />
                  {centroid ? (
                    <Marker
                      coordinate={centroid}
                      anchor={{ x: 0.5, y: 0.5 }}
                      onPress={() => onSelectZone?.(zone)}
                    >
                      <View className="items-center rounded-md border border-white/80 bg-navy/90 px-1.5 py-0.5 shadow-sm">
                        <Text className="text-[10px] font-bold text-white">{zone.name}</Text>
                        <Text className="text-[8px] font-semibold text-teal-light">{meta.label}</Text>
                      </View>
                    </Marker>
                  ) : null}
                </React.Fragment>
              );
            }

            if (zone.geometry.type === 'MultiPolygon') {
              return (
                <React.Fragment key={zone.id}>
                  {zone.geometry.coordinates.map((poly, idx) => (
                    <Polygon
                      key={`${zone.id}-${idx}`}
                      coordinates={poly[0]}
                      strokeColor={strokeColor}
                      fillColor={fillColor}
                      strokeWidth={isSelected ? 3 : 2}
                      tappable
                      onPress={() => onSelectZone?.(zone)}
                    />
                  ))}
                </React.Fragment>
              );
            }

            if (zone.geometry.type === 'Point') {
              return (
                <Marker
                  key={zone.id}
                  coordinate={zone.geometry.coordinates}
                  title={zone.name}
                  description={`Priority: ${meta.label} (${zone.priorityScore})`}
                  onPress={() => onSelectZone?.(zone)}
                >
                  <View className="h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-warning shadow">
                    <MapPin stroke="#FFFFFF" size={14} />
                  </View>
                </Marker>
              );
            }

            return null;
          })}

          {/* 2. Other Active Volunteers (Realtime / API) */}
          {validVolunteers.map((vol) => (
            <Marker
              key={vol.volunteerId}
              coordinate={{ latitude: vol.latitude, longitude: vol.longitude }}
              title={`Volunteer ${vol.volunteerId.slice(0, 6)}`}
              description={vol.zoneId ? `Assigned Zone: ${vol.zoneId}` : 'Active Searcher'}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View className="h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-teal shadow-md">
                <Users stroke="#FFFFFF" size={14} />
              </View>
            </Marker>
          ))}

          {/* 3. Evidence / Sighting Markers */}
          {evidenceMarkers.map((item) => (
            <Marker
              key={item.id}
              coordinate={item.coordinate}
              title={item.title ?? (item.kind === 'sighting' ? 'Sighting' : 'Evidence')}
              description={item.description}
            >
              <View className="h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-danger shadow-md">
                <MapPin stroke="#FFFFFF" size={14} />
              </View>
            </Marker>
          ))}

          {/* 4. Current Volunteer GPS Marker */}
          {currentLocation && isValidCoordinate(currentLocation) ? (
            <>
              {currentLocationAccuracy && currentLocationAccuracy > 0 ? (
                <Circle
                  center={currentLocation}
                  radius={Math.min(currentLocationAccuracy, 200)}
                  fillColor="rgba(37, 99, 235, 0.15)"
                  strokeColor="rgba(37, 99, 235, 0.35)"
                  strokeWidth={1}
                />
              ) : null}
              <Marker
                coordinate={currentLocation}
                anchor={{ x: 0.5, y: 0.5 }}
                title="Your Location"
                description="Live GPS Tracking Active"
              >
                <View className="h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue shadow-lg">
                  <View className="h-2.5 w-2.5 rounded-full bg-white" />
                </View>
              </Marker>
            </>
          ) : null}
        </MapView>

        {/* Map Header Status Overlay */}
        <View className="absolute left-3 right-3 top-3 flex-row items-center justify-between pointer-events-none">
          <View className="rounded-full bg-navy/85 px-3 py-1.5 backdrop-blur shadow">
            <Text className="text-xs font-semibold text-white">
              {currentLocation ? '● Live Search Map' : 'Search Area Map'}
            </Text>
          </View>
          {validVolunteers.length > 0 ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-teal-dark/90 px-2.5 py-1 shadow">
              <Users stroke="#FFFFFF" size={12} />
              <Text className="text-xs font-bold text-white">{validVolunteers.length} Active</Text>
            </View>
          ) : null}
        </View>

        {/* Recenter button */}
        {showControls ? (
          <View className="absolute bottom-3 right-3">
            <Pressable
              accessibilityLabel="Recenter map"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface shadow-md active:bg-background-muted"
              onPress={recenter}
            >
              <Crosshair stroke="#2563EB" size={18} />
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* Layer badges footer */}
      {layers && layers.length > 0 ? (
        <View className="flex-row flex-wrap gap-2 border-t border-border bg-surface p-3">
          {layers.map((layer) => {
            const Icon = layerIcons[layer as keyof typeof layerIcons];
            return (
              <View key={layer} className="flex-row items-center gap-1.5 rounded-full bg-background-muted px-2.5 py-1">
                {Icon ? <Icon stroke="#2563EB" size={12} /> : <View className="h-2 w-2 rounded-full bg-teal" />}
                <Text className="text-[11px] font-medium text-muted">{layerLabels[layer] ?? layer}</Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export function MapPlaceholder(props: TraceOneMapProps) {
  return <TraceOneMap {...props} />;
}
