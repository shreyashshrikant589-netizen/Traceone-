import type {
  RealtimeConnectionState,
  RealtimeEvent,
  RealtimeReconnectConfig,
  VolunteerLocationRealtimePayload,
} from "./types";

export type RealtimeAdapter<TEvent extends RealtimeEvent = RealtimeEvent> = {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(channel: string, handler: (event: TEvent) => void): Promise<void>;
  unsubscribe(channel: string): Promise<void>;
  publish(channel: string, event: TEvent): Promise<void>;
  getConnectionState(): RealtimeConnectionState;
};

export class NoopRealtimeAdapter implements RealtimeAdapter {
  private connectionState: RealtimeConnectionState = "DISCONNECTED";
  private reconnectConfig: RealtimeReconnectConfig = {
    enabled: true,
    initialDelayMs: 1500,
    maxDelayMs: 30000,
    maxAttempts: 5,
  };

  async connect(): Promise<void> {
    this.connectionState = "CONNECTED";
  }

  async disconnect(): Promise<void> {
    this.connectionState = "DISCONNECTED";
  }

  async subscribe(_channel: string, _handler: (event: RealtimeEvent) => void): Promise<void> {
    this.connectionState = "CONNECTED";
  }

  async unsubscribe(_channel: string): Promise<void> {
    this.connectionState = "DISCONNECTED";
  }

  async publish(_channel: string, _event: RealtimeEvent): Promise<void> {
    this.connectionState = "CONNECTED";
  }

  getConnectionState(): RealtimeConnectionState {
    return this.connectionState;
  }

  getReconnectConfig(): RealtimeReconnectConfig {
    return this.reconnectConfig;
  }

  setReconnectConfig(config: RealtimeReconnectConfig): void {
    this.reconnectConfig = config;
  }
}

export function createVolunteerLocationEvent(
  payload: VolunteerLocationRealtimePayload,
  eventId = `${payload.volunteerId}:${payload.timestamp}`,
): RealtimeEvent<VolunteerLocationRealtimePayload> {
  return {
    eventId,
    caseId: payload.caseId,
    eventType: "VOLUNTEER_LOCATION_UPDATED",
    timestamp: payload.timestamp,
    payload,
  };
}
