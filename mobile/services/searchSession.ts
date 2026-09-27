export type SearchSessionStatus = 'READY' | 'ACTIVE' | 'PAUSED' | 'FINISHED';
export type LocationStatus = 'GPS_CONNECTED' | 'LOCATION_UNAVAILABLE';

export type SearchSession = {
  caseName: string;
  zoneName: string;
  priority: 'Critical' | 'High' | 'Standard';
  status: SearchSessionStatus;
  locationStatus: LocationStatus;
  startedAt?: string;
  elapsedSeconds: number;
};

export type SearchSessionNote = { sessionToken: string; text: string; createdAt: string };
export type SearchSessionEvidence = { sessionToken: string; description: string; createdAt: string };
export type SearchSessionSighting = { sessionToken: string; description: string; createdAt: string };

export interface GpsAdapter {
  requestPermission(): Promise<boolean>;
  getLocationStatus(): Promise<LocationStatus>;
  startWatching(): Promise<void>;
  stopWatching(): Promise<void>;
}

export interface OfflineSessionAdapter {
  saveNote(note: SearchSessionNote): Promise<void>;
  saveEvidence(evidence: SearchSessionEvidence): Promise<void>;
  saveSighting(sighting: SearchSessionSighting): Promise<void>;
  finishSession(sessionToken: string): Promise<void>;
}
