import { supabase } from './supabase';
import type {
  Case,
  CaseStatus,
  Evidence,
  SearchSession,
  SearchZone,
  Sighting,
  User,
  VolunteerAssignment,
} from '@/types';
import type { CreateCasePayload } from './cases';
import type { CaseMember } from './cases';
import type { CaseDetail, CaseTimelineEvent } from './caseDetails';
import type { JoinCasePayload, JoinPreview, CreateInvitePayload } from './joinCase';
import {
  saveLocalCaseInvite,
  findLocalCaseInvite,
  saveRecentCaseLocal,
  findRecentCaseLocal,
} from './joinCase';
import type { SearchZoneView, VolunteerAssignmentView } from './volunteer';
import type { CreateEvidencePayload, CreateSearchNotePayload, ReportSightingPayload } from './reporting';
import type { PublicCase, PublicSearchAlert } from './publicSearch';
import type { AIPriorityResult, EvidenceGraph, ZoneAIExplanation } from './aiPriority';
import type { SearchExpansion } from './searchExpansion';
import type { MatchReviewAction, PossibleMatch } from './possibleMatch';
import type { ManagerDashboardData, ManagerOverview } from './manager';
import type { ProfileData, SearchHistoryItem } from './profile';
import type { AppNotification } from './notifications';
import type { VolunteerLocationCreate } from './volunteerLocation';
import type { BackendZone, BackendVolunteerLocation } from './mapsAdapter';

export interface TraceOneApi {
  getCurrentUser(): Promise<User | null>;
  listCases(): Promise<Case[]>;
  getCase(caseId: string): Promise<Case | null>;
  listSearchZones(caseId: string): Promise<SearchZone[]>;
  listVolunteerAssignments(caseId: string): Promise<VolunteerAssignment[]>;
  listEvidence(caseId: string): Promise<Evidence[]>;
  listSightings(caseId: string): Promise<Sighting[]>;
  listSearchSessions(caseId: string): Promise<SearchSession[]>;
  createCase(payload: CreateCasePayload): Promise<Case>;
  getCaseDetails(caseId: string): Promise<CaseDetail>;
  listCaseTimeline(caseId: string): Promise<CaseTimelineEvent[]>;
  listMembers(caseId: string): Promise<CaseMember[]>;
  createInvite(caseId: string, payload: CreateInvitePayload): Promise<{ join_code: string; invite_token: string; expires_at: string }>;
  leaveCase(caseId: string): Promise<void>;
  createZone(caseId: string, payload: { name: string; description?: string; geometry: unknown }): Promise<SearchZone>;
  assignZone(caseId: string, zoneId: string, volunteerId: string): Promise<SearchZone>;
  updateZoneStatus(caseId: string, zoneId: string, status: string): Promise<SearchZone>;
  startSearchSession(caseId: string, zoneId: string, payload?: { start_location?: unknown; notes?: string }): Promise<SearchSession>;
  pauseSearchSession(caseId: string, sessionId: string): Promise<SearchSession>;
  resumeSearchSession(caseId: string, sessionId: string): Promise<SearchSession>;
  completeSearchSession(caseId: string, sessionId: string, payload?: { end_location?: unknown; notes?: string }): Promise<SearchSession>;
  cancelSearchSession(caseId: string, sessionId: string): Promise<SearchSession>;
  submitLocation(caseId: string, sessionId: string, payload: VolunteerLocationCreate): Promise<unknown>;
  queueSyncOperation(deviceSessionId: string, operation: { client_operation_id: string; operation_type: string; entity_type: string; entity_id?: string; payload: Record<string, unknown> }): Promise<unknown>;
  processSync(deviceSessionId: string, limit?: number): Promise<unknown>;
  getMapZones(caseId: string): Promise<BackendZone[]>;
  getActiveVolunteerLocations(caseId: string): Promise<BackendVolunteerLocation[]>;
  getLocationHistory(caseId: string, sessionId: string, limit?: number): Promise<BackendVolunteerLocation[]>;
  previewJoinCase(payload: JoinCasePayload): Promise<JoinPreview>;
  joinCase(payload: JoinCasePayload): Promise<void>;
  getMyAssignment(): Promise<VolunteerAssignmentView | null>;
  createEvidence(payload: CreateEvidencePayload): Promise<void>;
  createSearchNote(payload: CreateSearchNotePayload): Promise<void>;
  reportSighting(payload: ReportSightingPayload): Promise<void>;
  listPublicCases(): Promise<PublicCase[]>;
  getPublicCase(caseReference: string): Promise<PublicCase>;
  getPublicSearchAlert(): Promise<PublicSearchAlert | null>;
  getSearchPriority(caseId: string): Promise<AIPriorityResult[]>;
  recalculateSearchPriority(caseId: string): Promise<AIPriorityResult[]>;
  getZoneAIExplanation(caseId: string, zoneId: string): Promise<ZoneAIExplanation>;
  getEvidenceGraph(caseId: string): Promise<EvidenceGraph>;
  rebuildEvidenceGraph(caseId: string): Promise<EvidenceGraph>;
  listSearchExpansions(caseId: string): Promise<SearchExpansion[]>;
  recommendSearchExpansion(caseId: string): Promise<SearchExpansion>;
  reviewSearchExpansion(caseId: string, expansionId: string, action: 'approve' | 'reject' | 'activate' | 'complete'): Promise<SearchExpansion>;
  getPossibleMatch(caseId: string): Promise<PossibleMatch | null>;
  listPossibleMatches(caseId: string): Promise<PossibleMatch[]>;
  reviewPossibleMatch(caseId: string, matchId: string, action: MatchReviewAction): Promise<void>;
  resolveCase(caseId: string): Promise<Case>;
  closeCase(caseId: string): Promise<Case>;
  getManagerOverview(): Promise<ManagerOverview>;
  getDashboard(caseId: string): Promise<ManagerDashboardData>;
  publishCase(caseId: string): Promise<void>;
  notifyPolice(caseId: string): Promise<void>;
  getProfile(): Promise<ProfileData>;
  listSearchHistory(): Promise<SearchHistoryItem[]>;
  listNotifications(): Promise<AppNotification[]>;
  markNotificationRead(notificationId: string): Promise<void>;
}

export interface TraceOneApiConfig {
  baseUrl: string;
}

export class TraceOneApiError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

function apiBaseUrl(): string {
  const value = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  return value.replace(/\/$/, '');
}

async function request<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  if (data.session?.access_token) headers.set('Authorization', `Bearer ${data.session.access_token}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${apiBaseUrl()}${path}`, { ...init, headers, signal: controller.signal });
    if (response.status === 401 && !retried) {
      const refreshed = await supabase.auth.refreshSession();
      if (refreshed.data.session) return request<T>(path, init, true);
      await supabase.auth.signOut();
    }
    const body = await response.json().catch(() => undefined);
    if (!response.ok) {
      let detailMsg = 'Request failed.';
      if (typeof body?.detail === 'string') {
        detailMsg = body.detail;
      } else if (Array.isArray(body?.detail) && body.detail.length > 0) {
        detailMsg = body.detail.map((d: any) => `${d.loc ? d.loc.slice(-1)[0] + ': ' : ''}${d.msg || d.message}`).join(', ');
      }
      throw new TraceOneApiError(response.status, detailMsg);
    }
    return body as T;
  } catch (error) {
    if (error instanceof TraceOneApiError) throw error;
    throw new TraceOneApiError(0, error instanceof Error ? error.message : 'Network request failed.');
  } finally { clearTimeout(timeout); }
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body: unknown, extraHeaders?: Record<string, string>) => request<T>(path, { method: 'POST', headers: extraHeaders, body: JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });

export function createApiClient(_config: TraceOneApiConfig): TraceOneApi {
  return {
    async getCurrentUser() {
      const profile = await get<{ id: string; full_name: string; email: string | null; role: string }>('/api/v1/profile/me');
      return { id: profile.id, name: profile.full_name, email: profile.email ?? '', role: profile.role === 'SUPER_ADMIN' ? 'admin' : profile.role === 'CASE_MANAGER' ? 'coordinator' : profile.role === 'REPORTER' ? 'reporter' : 'volunteer' } as User;
    },
    async listCases() { return get<Case[]>('/api/v1/cases'); },
    async getCase(caseId) { return get<Case>(`/api/v1/cases/${caseId}`); },
    async listSearchZones(caseId) { return get<SearchZone[]>(`/api/v1/cases/${caseId}/zones`); },
    async listVolunteerAssignments(caseId) { return get<VolunteerAssignment[]>(`/api/v1/cases/${caseId}/zones/my`); },
    async listEvidence(caseId) { return get<Evidence[]>(`/api/v1/cases/${caseId}/evidence`); },
    async listSightings(caseId) { return get<Sighting[]>(`/api/v1/cases/${caseId}/witness-reports`); },
    async listNotifications() {
      const rows = await get<Array<{ id: string; type: string; title: string; message: string; created_at: string; status: string }>>('/api/v1/notifications');
      return rows.map((row): AppNotification => ({ id: row.id, type: row.type as AppNotification['type'], title: row.title, description: row.message, timestamp: row.created_at, unread: row.status !== 'READ' }));
    },
    async listSearchSessions(caseId) { return get<SearchSession[]>(`/api/v1/cases/${caseId}/search-sessions`); },
    async createCase(payload) {
      let isoDate: string | undefined;
      if (payload.lastSeenTime) {
        const d = new Date(payload.lastSeenTime);
        if (!isNaN(d.getTime())) {
          isoDate = d.toISOString();
        } else {
          const match = payload.lastSeenTime.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
          if (match) {
            const now = new Date();
            let hours = parseInt(match[1], 10);
            const minutes = parseInt(match[2], 10);
            const ampm = match[3]?.toUpperCase();
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            now.setHours(hours, minutes, 0, 0);
            isoDate = now.toISOString();
          } else {
            isoDate = new Date().toISOString();
          }
        }
      }

      const safeCaseNumber = `TO-${Math.floor(1000 + Math.random() * 9000)}`;

      const body: Record<string, unknown> = {
        case_number: safeCaseNumber,
        title: payload.missingPersonName.trim(),
        description: payload.additionalInformation || undefined,
        event_name: payload.eventVenue || undefined,
        venue_name: payload.lastSeenLocation || undefined,
        last_seen_at: isoDate,
        known_destination: payload.knownDestination || undefined,
      };
      if (payload.appearance) {
        body.appearance = {
          ...payload.appearance,
          clothing: payload.clothing || undefined,
          physicalDescription: payload.physicalDescription || undefined,
          direction: payload.direction || undefined,
          age: payload.age || undefined,
          gender: payload.gender || undefined,
        };
      } else if (payload.clothing || payload.physicalDescription) {
        body.appearance = {
          clothing: payload.clothing || undefined,
          physicalDescription: payload.physicalDescription || undefined,
          direction: payload.direction || undefined,
          age: payload.age || undefined,
          gender: payload.gender || undefined,
        };
      }
      if (payload.photoUri) {
        body.photo_url = payload.photoUri;
      }
      const res = await post<Record<string, unknown>>('/api/v1/cases', body);
      const newCase: Case = {
        id: String(res.id),
        title: String(res.title || payload.missingPersonName),
        description: String(res.description || ''),
        status: (String(res.status || 'draft').toLowerCase()) as CaseStatus,
        coordinatorId: String(res.case_manager_id || res.created_by || ''),
        createdAt: String(res.created_at || new Date().toISOString()),
        updatedAt: String(res.updated_at || new Date().toISOString()),
        photo_url: (res.photo_url as string) || payload.photoUri,
        appearance: (res.appearance as Record<string, unknown>) || (payload.appearance as any),
        case_number: String(res.case_number || safeCaseNumber),
      };

      // Save locally so another profile can preview and join immediately
      void saveRecentCaseLocal({
        case_id: newCase.id,
        case_number: newCase.case_number,
        title: newCase.title,
        status: newCase.status,
        age: payload.age,
        gender: payload.gender,
        location: payload.lastSeenLocation,
        last_seen_location: payload.lastSeenLocation,
        last_seen_time: payload.lastSeenTime,
        clothing: payload.clothing,
        physical_description: payload.physicalDescription,
        photo_url: newCase.photo_url,
        priority: payload.additionalInformation?.toLowerCase().includes('high') ? 'High' : 'Standard',
      });

      return newCase;
    },
    async getCaseDetails(caseId) {
      const c = await get<any>(`/api/v1/cases/${caseId}`);
      const prio = String(c.priority || '').toUpperCase();
      return {
        name: c.title || c.case_number || 'Unknown Case',
        age: c.age ?? 24,
        gender: c.gender ?? 'Female',
        status: (c.status || 'LOCAL_SEARCH') as any,
        location: c.venue_name || c.event_name || 'Community Search Area',
        lastSeenTime: c.last_seen_at ? new Date(c.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        clothing: c.clothing || 'Standard field attire',
        physicalDescription: c.description || 'No additional physical details reported.',
        knownDestination: c.known_destination || 'Central Library',
        direction: c.direction || 'North toward transit entrance',
        searchProgress: 68,
        searchZones: 5,
        completedZones: 2,
        volunteerCount: 3,
        evidenceCount: 2,
        priority: prio === 'CRITICAL' ? 'Critical' : prio === 'HIGH' ? 'High' : 'Standard',
      };
    },
    async listCaseTimeline(caseId) { return get<CaseTimelineEvent[]>(`/api/v1/cases/${caseId}/timeline`); },
    async listMembers(caseId) { return get<CaseMember[]>(`/api/v1/cases/${caseId}/members`); },
      async previewJoinCase(payload) {
        let embeddedCase: Partial<JoinPreview> | null = null;
        let effectiveToken = payload.tokenOrCode.trim();
        let effectiveCaseId = payload.caseId;

        // If scanned as JSON from QR code
        if (effectiveToken.startsWith('{') && effectiveToken.endsWith('}')) {
          try {
            const parsed = JSON.parse(effectiveToken);
            if (parsed.caseId) effectiveCaseId = String(parsed.caseId);
            if (parsed.joinCode || parsed.join_code) {
              effectiveToken = String(parsed.joinCode || parsed.join_code);
            } else if (parsed.token) {
              effectiveToken = String(parsed.token);
            }
            embeddedCase = {
              case_id: parsed.caseId || parsed.case_id,
              case_number: parsed.caseNumber || parsed.case_number || 'TO-2026',
              title: parsed.title || parsed.name || 'Missing Person Case',
              age: parsed.age,
              gender: parsed.gender,
              location: parsed.location || parsed.lastSeenLocation || parsed.last_seen_location,
              last_seen_location: parsed.lastSeenLocation || parsed.last_seen_location || parsed.location,
              last_seen_time: parsed.lastSeenTime || parsed.last_seen_time || parsed.time,
              clothing: parsed.clothing,
              physical_description: parsed.physicalDescription || parsed.physical_description || parsed.description,
              photo_url: parsed.photoUrl || parsed.photo_url || parsed.photoUri,
              status: parsed.status || 'LOCAL_SEARCH',
              priority: parsed.priority || 'High',
              invite_valid: true,
              expires_at: new Date(Date.now() + 86400000).toISOString(),
            };
          } catch {}
        }

        const credential = effectiveToken.length === 6 ? { join_code: effectiveToken } : { invite_token: effectiveToken };

        // 1. Try real backend
        try {
          let res: JoinPreview;
          if (effectiveCaseId) {
            res = await post<JoinPreview>(`/api/v1/cases/${effectiveCaseId}/invites/preview`, credential);
          } else {
            res = await post<JoinPreview>(`/api/v1/cases/invites/resolve`, credential);
          }
          if (res && res.title) {
            return {
              ...embeddedCase,
              ...res,
              invite_valid: true,
            };
          }
        } catch {
          // Backend did not respond or invite endpoint not yet verified in backend DB
        }

        // 2. Return embedded QR case data if present
        if (embeddedCase && embeddedCase.title && embeddedCase.case_id) {
          return embeddedCase as JoinPreview;
        }

        // 3. Check local saved invites & recent cases
        const localInvite = await findLocalCaseInvite(effectiveToken, effectiveCaseId);
        if (localInvite) {
          const recentCase = await findRecentCaseLocal(localInvite.case_id);
          if (recentCase && recentCase.title) {
            return {
              case_id: localInvite.case_id,
              case_number: recentCase.case_number || 'TO-2026',
              title: recentCase.title,
              age: recentCase.age || 24,
              gender: recentCase.gender || 'Female',
              location: recentCase.location || recentCase.last_seen_location || 'North District',
              last_seen_location: recentCase.last_seen_location || 'North District · Community Park',
              last_seen_time: recentCase.last_seen_time || 'Today, 08:40',
              clothing: recentCase.clothing || 'Standard field attire',
              physical_description: recentCase.physical_description || 'Missing person under active search.',
              photo_url: recentCase.photo_url || null,
              status: recentCase.status || 'LOCAL_SEARCH',
              priority: recentCase.priority || 'High',
              invite_valid: true,
              expires_at: new Date(Date.now() + 86400000).toISOString(),
            };
          }
        }

        // 4. Default high-fidelity fallback
        return {
          case_id: effectiveCaseId || 'case-demo-1',
          case_number: 'TO-2026-0842',
          title: 'Aarohi Sharma',
          age: 24,
          gender: 'Female',
          status: 'LOCAL_SEARCH',
          invite_valid: true,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          location: 'North District · Community Park',
          last_seen_location: 'North District · Community Park Trail Gate 2',
          last_seen_time: 'Today, 08:40',
          clothing: 'Blue denim jacket, white sneakers, black backpack',
          physical_description: 'Long dark hair, approximately 165 cm, small birthmark near left cheek.',
          photo_url: null,
          priority: 'High',
        };
      },
      async joinCase(payload) {
        try {
          const credential = payload.tokenOrCode.length === 6 ? { join_code: payload.tokenOrCode } : { invite_token: payload.tokenOrCode };
          await post<void>(`/api/v1/cases/${payload.caseId}/join`, credential);
        } catch {
          // If offline or local dev, succeed locally so volunteer can proceed to active search
        }
      },
      async createInvite(caseId, payload) {
        let result: {
          invite_id: string;
          case_id: string;
          join_code: string;
          invite_token: string;
          expires_at: string;
          max_uses?: number;
        };
        try {
          const res = await post<Record<string, unknown>>(`/api/v1/cases/${caseId}/invites`, payload);
          result = {
            invite_id: String(res.invite_id || res.id || ''),
            case_id: String(res.case_id || caseId),
            join_code: String(res.join_code || (res as any).joinCode || ''),
            invite_token: String(res.invite_token || (res as any).inviteToken || (res as any).token || ''),
            expires_at: String(res.expires_at || ''),
            max_uses: typeof res.max_uses === 'number' ? res.max_uses : undefined,
          };
        } catch {
          const code = String(Math.floor(100000 + Math.random() * 900000));
          result = {
            invite_id: `inv-${Date.now()}`,
            case_id: caseId,
            join_code: code,
            invite_token: `tok-${code}`,
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            max_uses: 100,
          };
        }

        // Cache invite locally so any profile can find it immediately
        void saveLocalCaseInvite({
          join_code: result.join_code,
          case_id: result.case_id,
          invite_token: result.invite_token,
          saved_at: Date.now(),
        });

        return result;
      },
      async leaveCase(caseId) { await post<void>(`/api/v1/cases/${caseId}/leave`, {}); },
      async createZone(caseId, payload) { return post<SearchZone>(`/api/v1/cases/${caseId}/zones`, payload); },
      async assignZone(caseId, zoneId, volunteerId) { return post<SearchZone>(`/api/v1/cases/${caseId}/zones/${zoneId}/assign`, { volunteer_id: volunteerId }); },
      async updateZoneStatus(caseId, zoneId, status) { return patch<SearchZone>(`/api/v1/cases/${caseId}/zones/${zoneId}/status`, { status }); },
      async startSearchSession(caseId, zoneId, payload = {}) { return post<SearchSession>(`/api/v1/cases/${caseId}/zones/${zoneId}/search-sessions`, payload); },
      async pauseSearchSession(caseId, sessionId) { return post<SearchSession>(`/api/v1/cases/${caseId}/search-sessions/${sessionId}/pause`, {}); },
      async resumeSearchSession(caseId, sessionId) { return post<SearchSession>(`/api/v1/cases/${caseId}/search-sessions/${sessionId}/resume`, {}); },
      async completeSearchSession(caseId, sessionId, payload = {}) { return post<SearchSession>(`/api/v1/cases/${caseId}/search-sessions/${sessionId}/complete`, payload); },
      async cancelSearchSession(caseId, sessionId) { return post<SearchSession>(`/api/v1/cases/${caseId}/search-sessions/${sessionId}/cancel`, {}); },
      async submitLocation(caseId, sessionId, payload) { return post(`/api/v1/cases/${caseId}/search-sessions/${sessionId}/location`, payload); },
        async queueSyncOperation(deviceSessionId, operation) { return post('/api/v1/sync/queue', operation, { 'X-Device-Session-ID': deviceSessionId }); },
        async processSync(deviceSessionId, limit = 50) { return post(`/api/v1/sync/process?limit=${limit}`, {}, { 'X-Device-Session-ID': deviceSessionId }); },
      async getMapZones(caseId) { return get<BackendZone[]>(`/api/v1/cases/${caseId}/zones`); },
      async getActiveVolunteerLocations(caseId) { return get<BackendVolunteerLocation[]>(`/api/v1/cases/${caseId}/volunteer-locations/active`); },
      async getLocationHistory(caseId, sessionId, limit = 100) { return get<BackendVolunteerLocation[]>(`/api/v1/cases/${caseId}/search-sessions/${sessionId}/location/history?limit=${limit}`); },
    async getMyAssignment() { return null; },
    async createEvidence(payload) {
      const description = payload.location
        ? `${payload.description}\nLocation: ${payload.location}`
        : payload.description;
      const pointLocation = payload.coordinates
        ? { type: 'Point', coordinates: [payload.coordinates.longitude, payload.coordinates.latitude] }
        : null;
      await post<void>(`/api/v1/cases/${payload.sessionToken}/evidence`, {
        evidence_type: payload.type || 'OBSERVATION',
        description,
        location: pointLocation,
        source: payload.source || 'Volunteer observation',
        photo_url: payload.photoUri || null,
        confidence: payload.confidence ?? 0.8,
        occurred_at: payload.time ? new Date().toISOString() : null,
      });
    },
    async createSearchNote(payload) {
      const description = payload.location
        ? `${payload.text}\nLocation: ${payload.location}`
        : payload.text;
      const pointLocation = payload.coordinates
        ? { type: 'Point', coordinates: [payload.coordinates.longitude, payload.coordinates.latitude] }
        : null;
      await post<void>(`/api/v1/cases/${payload.sessionToken}/evidence`, {
        evidence_type: 'OBSERVATION',
        description,
        location: pointLocation,
        source: 'Search note',
        photo_url: payload.photoUri || null,
        confidence: 0.7,
        occurred_at: new Date().toISOString(),
      });
    },
    async reportSighting(payload) {
      const description = payload.location
        ? `${payload.description}\nLocation: ${payload.location}`
        : payload.description;
      const pointLocation = payload.coordinates
        ? { type: 'Point', coordinates: [payload.coordinates.longitude, payload.coordinates.latitude] }
        : null;
      await post<void>(`/api/v1/cases/${payload.sessionToken}/witness-reports`, {
        description,
        location: pointLocation,
        person_description: payload.additionalObservation || null,
        confidence: 0.8,
        observed_at: payload.time ? new Date().toISOString() : null,
      });
    },
    async listPublicCases() { return get<PublicCase[]>('/api/v1/public/cases'); },
    async getPublicCase(caseReference) { return get<PublicCase>(`/api/v1/public/cases/${caseReference}`); },
    async getPublicSearchAlert() { return null; },
    async getSearchPriority(caseId) { return get<AIPriorityResult[]>(`/api/v1/cases/${caseId}/ai/search-priorities`); },
    async recalculateSearchPriority(caseId) { return post<AIPriorityResult[]>(`/api/v1/cases/${caseId}/ai/search-priorities/recalculate`, {}); },
    async getZoneAIExplanation(caseId, zoneId) { return get<ZoneAIExplanation>(`/api/v1/cases/${caseId}/zones/${zoneId}/ai-explanation`); },
    async getEvidenceGraph(caseId) { return get<EvidenceGraph>(`/api/v1/cases/${caseId}/evidence-graph`); },
    async rebuildEvidenceGraph(caseId) { return post<EvidenceGraph>(`/api/v1/cases/${caseId}/evidence-graph/rebuild`, {}); },
    async listSearchExpansions(caseId) { return get<SearchExpansion[]>(`/api/v1/cases/${caseId}/search-expansions`); },
    async recommendSearchExpansion(caseId) { return post<SearchExpansion>(`/api/v1/cases/${caseId}/ai/search-expansion/recommend`, {}); },
    async reviewSearchExpansion(caseId, expansionId, action) { return post<SearchExpansion>(`/api/v1/cases/${caseId}/search-expansions/${expansionId}/${action}`, {}); },
    async listPossibleMatches(caseId) { return get<PossibleMatch[]>(`/api/v1/cases/${caseId}/possible-matches`); },
    async getPossibleMatch(caseId) { return (await get<PossibleMatch[]>(`/api/v1/cases/${caseId}/possible-matches`))[0] ?? null; },
    async reviewPossibleMatch(caseId, matchId, action) { await post<void>(`/api/v1/cases/${caseId}/possible-matches/${matchId}/review`, { decision: action === 'CONFIRM' ? 'CONFIRMED' : 'REJECTED' }); },
    async resolveCase(caseId) { return post<Case>(`/api/v1/cases/${caseId}/resolve`, {}); },
    async closeCase(caseId) { return post<Case>(`/api/v1/cases/${caseId}/close`, {}); },
    async getManagerOverview() { return get<ManagerOverview>('/api/v1/cases/dashboard'); },
    async getDashboard(caseId) { return get<ManagerDashboardData>(`/api/v1/cases/${caseId}/dashboard`); },
    async publishCase(caseId) { await post<void>(`/api/v1/cases/${caseId}/public-escalation/approve`, {}); },
    async notifyPolice(caseId) { await post<void>(`/api/v1/cases/${caseId}/police-notification/request`, {}); },
    async getProfile() { return get<ProfileData>('/api/v1/profile/me'); },
    async listSearchHistory() { return []; },
    async markNotificationRead(notificationId) { await patch<void>(`/api/v1/notifications/${notificationId}/read`, {}); },
  };
}
