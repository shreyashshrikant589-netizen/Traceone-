import { AsyncStorageOfflineStorage, writeOfflineRecord, OFFLINE_CACHE_PREFIX } from '@maps/offline/storage';
import { OfflineSyncEngine, type SyncTransport } from '@maps/offline/sync';
import { enqueueOperation, listSyncOperations, type SyncOperation, type SyncTransportResult } from '@maps/offline';
import type { TraceOneApi } from './api';
import type { CreateCasePayload } from './cases';
import type { CreateEvidencePayload, ReportSightingPayload } from './reporting';
import type { Case } from '@/types';

export const storage = new AsyncStorageOfflineStorage();
const DEVICE_KEY = 'traceone:offline:device-session-id';

function createId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function deviceSessionId(): Promise<string> {
  const existing = await storage.getItem<string>(DEVICE_KEY);
  if (existing) return existing;
  const created = createId();
  await storage.setItem(DEVICE_KEY, created);
  return created;
}

export async function queueLocation(api: TraceOneApi, caseId: string, sessionId: string, payload: Record<string, unknown>): Promise<void> {
  await enqueueOperation(storage, { caseId, operationType: 'SUBMIT_LOCATION', payload: { ...payload, case_id: caseId, session_id: sessionId }, clientOperationId: `location:${caseId}:${sessionId}:${payload.recorded_at}` });
}

export async function queueOfflineCase(payload: CreateCasePayload & { id?: string }): Promise<Case> {
  const caseId = payload.id || `offline-case-${Date.now()}`;
  const now = new Date().toISOString();
  const caseObj: Case = {
    id: caseId,
    title: payload.missingPersonName,
    description: `Missing: ${payload.missingPersonName}, Age ${payload.age}. Last seen at ${payload.lastSeenLocation}.${payload.additionalInformation ? ` ${payload.additionalInformation}` : ''}`,
    status: 'active',
    coordinatorId: 'me',
    createdAt: now,
    updatedAt: now,
  };
  await writeOfflineRecord(storage, 'cases', caseId, caseObj);
  await enqueueOperation(storage, {
    caseId,
    operationType: 'CREATE_CASE',
    payload: { ...payload, id: caseId },
    clientOperationId: `case:${caseId}:${Date.now()}`,
  });
  return caseObj;
}

export async function getOfflineCases(): Promise<Case[]> {
  try {
    const records = await storage.list<{ id: string; data: Case }>(`${OFFLINE_CACHE_PREFIX}:cases:`);
    return records.map((r) => r.data).filter(Boolean);
  } catch {
    return [];
  }
}

export async function queueOfflineEvidence(payload: CreateEvidencePayload): Promise<void> {
  await enqueueOperation(storage, {
    caseId: payload.sessionToken,
    operationType: 'CREATE_EVIDENCE',
    payload,
    clientOperationId: `evidence:${payload.sessionToken}:${Date.now()}`,
  });
}

export async function queueOfflineSighting(payload: ReportSightingPayload): Promise<void> {
  await enqueueOperation(storage, {
    caseId: payload.sessionToken,
    operationType: 'REPORT_SIGHTING',
    payload,
    clientOperationId: `sighting:${payload.sessionToken}:${Date.now()}`,
  });
}

export async function getPendingOperationsCount(): Promise<number> {
  try {
    const ops = await listSyncOperations(storage);
    return ops.filter((o) => o.status === 'PENDING' || o.status === 'FAILED').length;
  } catch {
    return 0;
  }
}

export function createSyncEngine(api: TraceOneApi): OfflineSyncEngine {
  const transport: SyncTransport = {
    async send(operation: SyncOperation<unknown>): Promise<SyncTransportResult> {
      try {
        const payload = (operation.payload && typeof operation.payload === 'object' ? operation.payload : {}) as Record<string, unknown>;

        if (operation.operationType === 'CREATE_CASE') {
          await api.createCase(payload as unknown as CreateCasePayload);
          return { accepted: true, status: 'SYNCED' };
        }

        if (operation.operationType === 'CREATE_EVIDENCE') {
          await api.createEvidence(payload as unknown as CreateEvidencePayload);
          return { accepted: true, status: 'SYNCED' };
        }

        if (operation.operationType === 'REPORT_SIGHTING') {
          await api.reportSighting(payload as unknown as ReportSightingPayload);
          return { accepted: true, status: 'SYNCED' };
        }

        const deviceId = await deviceSessionId();
        await api.queueSyncOperation(deviceId, {
          client_operation_id: operation.clientOperationId,
          operation_type: operation.operationType,
          entity_type: operation.operationType === 'SUBMIT_LOCATION' ? 'volunteer_locations' : 'reports',
          entity_id: operation.operationType === 'SUBMIT_LOCATION' ? String(payload.session_id) : undefined,
          payload: { ...payload, case_id: operation.caseId },
        });
        await api.processSync(deviceId, 1);
        return { accepted: true, status: 'SYNCED' };
      } catch (error) {
        return { accepted: false, status: 'FAILED', errorMessage: error instanceof Error ? error.message : 'Sync failed.' };
      }
    },
  };
  return new OfflineSyncEngine({ storage, transport, maxRetries: 3 });
}
