import React, { useMemo, useState } from 'react';
import {
  Compass,
  Crosshair,
  Hospital,
  MapPin,
  Navigation,
  ParkingSquare,
  Radio,
  Shield,
  TrainFront,
  UserRound,
  Users,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
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

export function TraceOneMap({
  layers = ['SEARCH_ZONES', 'VOLUNTEER_LOCATION'],
  zones = [],
  currentLocation,
  currentLocationAccuracy,
  volunteerLocations = [],
  selectedZoneId,
  onSelectZone,
  height = 280,
  showControls = true,
}: TraceOneMapProps) {
  const [isCentered, setIsCentered] = useState(true);

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
    return volunteerLocations.filter((v) =>
      isValidCoordinate({ latitude: v.latitude, longitude: v.longitude }),
    );
  }, [volunteerLocations]);

  const activeZone = useMemo(() => {
    if (selectedZoneId) {
      return renderableZones.find((z) => z.id === selectedZoneId) ?? renderableZones[0];
    }
    return renderableZones[0];
  }, [selectedZoneId, renderableZones]);

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-[#0B1528] shadow-sm">
      <View style={{ height }} className="relative justify-between overflow-hidden p-3.5">
        {/* Radar / Grid Tactical Background */}
        <View style={StyleSheet.absoluteFill} className="items-center justify-center opacity-30">
          <View className="h-64 w-64 rounded-full border border-teal/40" />
          <View className="absolute h-48 w-48 rounded-full border border-teal/30" />
          <View className="absolute h-32 w-32 rounded-full border border-teal/20" />
          <View className="absolute h-full w-[1px] bg-teal/15" />
          <View className="absolute h-[1px] w-full bg-teal/15" />
        </View>

        {/* Map Header Status Overlay */}
        <View className="z-10 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 rounded-full border border-white/10 bg-navy-dark/90 px-3 py-1.5 backdrop-blur-md">
            <Radio stroke="#06B6D4" size={13} />
            <Text className="text-xs font-semibold text-white">
              {currentLocation ? 'Live Tactical Map' : 'Tactical Search Grid'}
            </Text>
          </View>
          {validVolunteers.length > 0 ? (
            <View className="flex-row items-center gap-1.5 rounded-full border border-teal/30 bg-teal/20 px-2.5 py-1">
              <Users stroke="#38BDF8" size={12} />
              <Text className="text-xs font-bold text-teal-light">{validVolunteers.length} Active</Text>
            </View>
          ) : null}
        </View>

        {/* Tactical Central Display */}
        <View className="z-10 my-auto items-center justify-center">
          {activeZone ? (
            <Pressable
              onPress={() => onSelectZone?.(activeZone)}
              className="items-center rounded-xl border border-teal/40 bg-navy/80 px-4 py-2.5 shadow-lg backdrop-blur-md active:bg-navy"
            >
              <View className="flex-row items-center gap-2">
                <MapPin stroke="#F59E0B" size={16} />
                <Text className="text-sm font-bold text-white">{activeZone.name}</Text>
              </View>
              <View className="mt-1 flex-row items-center gap-2">
                <Text className="text-[11px] font-semibold text-teal-light">
                  Priority: {zonePriorityMetadata(activeZone.priorityScore).label}
                </Text>
                <Text className="text-[11px] text-slate-300">
                  • Status: {activeZone.status}
                </Text>
              </View>
            </Pressable>
          ) : (
            <View className="items-center rounded-xl border border-white/10 bg-navy/70 px-4 py-2">
              <Compass stroke="#38BDF8" size={24} />
              <Text className="mt-1 text-xs font-semibold text-slate-200">Active Search Grid</Text>
            </View>
          )}

          {/* Live Coordinates readout */}
          {currentLocation && isValidCoordinate(currentLocation) ? (
            <View className="mt-2.5 flex-row items-center gap-1.5 rounded-full border border-blue/30 bg-blue/15 px-3 py-1">
              <Navigation stroke="#60A5FA" size={12} />
              <Text className="font-mono text-[11px] text-blue-200">
                {currentLocation.latitude.toFixed(4)}°N, {currentLocation.longitude.toFixed(4)}°E
              </Text>
              {currentLocationAccuracy ? (
                <Text className="text-[10px] text-slate-400"> (±{Math.round(currentLocationAccuracy)}m)</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Interactive Controls & Zone Badges */}
        <View className="z-10 flex-row items-end justify-between">
          <View className="flex-row flex-wrap gap-1.5">
            {renderableZones.slice(0, 3).map((zone) => {
              const meta = zonePriorityMetadata(zone.priorityScore);
              const isSelected = selectedZoneId === zone.id;
              return (
                <Pressable
                  key={zone.id}
                  onPress={() => onSelectZone?.(zone)}
                  className={`rounded-lg border px-2 py-1 ${
                    isSelected ? 'border-teal bg-teal/30' : 'border-white/10 bg-navy/80'
                  }`}
                >
                  <Text className="text-[10px] font-bold text-white">{zone.name}</Text>
                  <Text style={{ color: meta.color }} className="text-[8px] font-semibold">
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {showControls ? (
            <View className="flex-row gap-2">
              <Pressable
                accessibilityLabel="Recenter map"
                accessibilityRole="button"
                className="h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-navy/90 shadow active:bg-slate-800"
                onPress={() => setIsCentered((c) => !c)}
              >
                <Crosshair stroke={isCentered ? '#38BDF8' : '#94A3B8'} size={16} />
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      {/* Layer badges footer */}
      {layers && layers.length > 0 ? (
        <View className="flex-row flex-wrap gap-2 border-t border-white/10 bg-navy-dark p-3">
          {layers.map((layer) => {
            const Icon = layerIcons[layer as keyof typeof layerIcons];
            return (
              <View
                key={layer}
                className="flex-row items-center gap-1.5 rounded-full border border-white/5 bg-navy px-2.5 py-1"
              >
                {Icon ? <Icon stroke="#38BDF8" size={12} /> : <View className="h-2 w-2 rounded-full bg-teal" />}
                <Text className="text-[11px] font-medium text-slate-300">{layerLabels[layer] ?? layer}</Text>
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
