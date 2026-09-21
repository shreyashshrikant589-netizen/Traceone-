export type MapLayer = 'LAST_SEEN_LOCATION' | 'SEARCH_BOUNDARY' | 'SEARCH_ZONES' | 'VOLUNTEER_LOCATION' | 'EXITS' | 'ROADS' | 'PARKING' | 'TRANSPORT_NODES' | 'HOSPITALS' | 'POLICE_STATIONS' | 'SAFE_POINTS';

export type MapViewport = { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };

export type MapInterfaceConfig = { viewport?: MapViewport; layers: MapLayer[] };

export interface TraceOneMapService {
  renderMap(config: MapInterfaceConfig): unknown;
}
