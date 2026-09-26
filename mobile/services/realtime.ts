import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { RealtimeAdapter } from '@maps/realtime/adapter';
import type { RealtimeEvent, RealtimeEventType } from '@maps/realtime/types';

const EVENT_TYPES: RealtimeEventType[] = ['VOLUNTEER_LOCATION_UPDATED', 'ZONE_ASSIGNED', 'ZONE_STARTED', 'ZONE_COMPLETED', 'SIGHTING_CREATED', 'EVIDENCE_UPDATED', 'PRIORITY_UPDATED', 'CASE_PUBLIC', 'CASE_RESOLVED'];

type RealtimeRow = Record<string, unknown>;

function eventType(value: unknown): RealtimeEventType | null {
  return typeof value === 'string' && EVENT_TYPES.includes(value as RealtimeEventType) ? value as RealtimeEventType : null;
}

function eventFromRow(row: RealtimeRow, fallbackType: RealtimeEventType): RealtimeEvent {
  const timestamp = typeof row.recorded_at === 'string' ? Date.parse(row.recorded_at) : Date.now();
  const mapped = eventType(row.event_type) ?? fallbackType;
  return { eventId: String(row.id ?? `${mapped}:${timestamp}`), caseId: typeof row.case_id === 'string' ? row.case_id : null, eventType: mapped, timestamp, payload: row };
}

export class SupabaseRealtimeAdapter implements RealtimeAdapter {
  private readonly channels = new Map<string, RealtimeChannel>();
  private state: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'ERROR' = 'DISCONNECTED';

  constructor(private readonly client: SupabaseClient) {}

  async connect(): Promise<void> {
    this.state = 'CONNECTED';
  }

  async disconnect(): Promise<void> {
    await Promise.all([...this.channels.values()].map((channel) => this.client.removeChannel(channel)));
    this.channels.clear();
    this.state = 'DISCONNECTED';
  }

  async subscribe(channelKey: string, handler: (event: RealtimeEvent) => void): Promise<void> {
    if (this.channels.has(channelKey)) return;
    this.state = 'CONNECTING';
    const [scope, caseId] = channelKey.split(':');
    const table = scope === 'locations' ? 'volunteer_locations' : scope === 'zones' ? 'zones' : 'search_sessions';
    const fallback: RealtimeEventType = scope === 'locations' ? 'VOLUNTEER_LOCATION_UPDATED' : scope === 'zones' ? 'ZONE_STARTED' : 'ZONE_STARTED';
    const channel = this.client.channel(`traceone:${channelKey}`).on('postgres_changes', { event: '*', schema: 'public', table, filter: `case_id=eq.${caseId}` }, (payload) => handler(eventFromRow((payload.new ?? payload.old ?? {}) as RealtimeRow, fallback))).subscribe((status) => { this.state = status === 'SUBSCRIBED' ? 'CONNECTED' : status === 'CHANNEL_ERROR' ? 'ERROR' : this.state; });
    this.channels.set(channelKey, channel);
  }

  async unsubscribe(channelKey: string): Promise<void> {
    const channel = this.channels.get(channelKey);
    if (!channel) return;
    await this.client.removeChannel(channel);
    this.channels.delete(channelKey);
    if (this.channels.size === 0) this.state = 'DISCONNECTED';
  }

  async publish(): Promise<void> {
    throw new Error('TraceOne realtime is database-driven; publish through the backend API.');
  }

  getConnectionState() { return this.state; }
}

export function createRealtimeChannelKey(kind: 'locations' | 'zones' | 'sessions', caseId: string): string { return `${kind}:${caseId}`; }
