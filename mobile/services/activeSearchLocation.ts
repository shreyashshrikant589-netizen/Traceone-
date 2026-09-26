import { ExpoLocationProvider } from '@maps/location/gps/expoLocationProvider';
import { isValidCoordinate } from '@maps/location/coordinates';
import type { GPSLocation } from '@maps/location/types';
import type { TraceOneApi } from './api';
import { TraceOneApiError } from './api';
import { queueLocation } from './offlineSync';

export type TrackingState = 'STARTING' | 'TRACKING' | 'PERMISSION_DENIED' | 'UNAVAILABLE' | 'STOPPED';

export function startForegroundLocationTracking(
  api: TraceOneApi,
  caseId: string,
  sessionId: string,
  onState?: (state: TrackingState) => void,
  intervalMs = 15000,
  onLocation?: (location: GPSLocation) => void,
): () => void {
  const provider = new ExpoLocationProvider();
  let stopped = false;
  let timer: ReturnType<typeof setInterval> | undefined;
  const send = async (location: GPSLocation) => {
    if (!isValidCoordinate(location) || stopped) return;
    await api.submitLocation(caseId, sessionId, { latitude: location.latitude, longitude: location.longitude, accuracy_m: location.accuracy ?? undefined, speed: location.speed ?? undefined, heading: location.heading ?? undefined, recorded_at: new Date(location.timestamp).toISOString() });
  };
  const tick = async () => {
    const result = await provider.getCurrentLocation();
    if (stopped) return;
    if (result.status === 'UNAVAILABLE' || !result.location) { onState?.('UNAVAILABLE'); return; }
    onState?.('TRACKING');
    onLocation?.(result.location);
    try { await send(result.location); } catch (error) {
      if (error instanceof TraceOneApiError && error.status === 0) {
        await queueLocation(api, caseId, sessionId, { latitude: result.location.latitude, longitude: result.location.longitude, accuracy_m: result.location.accuracy, speed: result.location.speed, heading: result.location.heading, recorded_at: new Date(result.location.timestamp).toISOString() });
      }
      onState?.('UNAVAILABLE');
    }
  };
  void (async () => {
    onState?.('STARTING');
    const permission = await provider.requestPermission();
    if (permission !== 'GRANTED') { onState?.('PERMISSION_DENIED'); return; }
    if (stopped) return;
    await tick();
    timer = setInterval(() => void tick(), intervalMs);
  })();
  return () => { stopped = true; if (timer) clearInterval(timer); onState?.('STOPPED'); };
}
