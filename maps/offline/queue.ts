import { OFFLINE_QUEUE_PREFIX, type OfflineStorage } from "./storage";
import type {
  OfflineOperationInput,
  QueueFilter,
  SyncOperation,
  SyncOperationStatus,
} from "./types";

function stableStringify(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (typeof value === "object") {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${stableStringify(
            (value as Record<string, unknown>)[key],
          )}`,
      );

    return `{${entries.join(",")}}`;
  }

  return String(value);
}

function hashString(input: string): string {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createClientOperationId<TPayload>(
  caseId: string,
  operationType: string,
  createdAt: number,
  payload: TPayload,
): string {
  const serialized = stableStringify({ caseId, operationType, createdAt, payload });
  return `${operationType}:${caseId}:${createdAt}:${hashString(serialized)}`;
}

export function sortOperations<T>(
  operations: SyncOperation<T>[],
): SyncOperation<T>[] {
  return [...operations].sort((left, right) => {
    if (left.createdAt !== right.createdAt) {
      return left.createdAt - right.createdAt;
    }

    if (left.caseId !== right.caseId) {
      return left.caseId.localeCompare(right.caseId);
    }

    if (left.operationType !== right.operationType) {
      return left.operationType.localeCompare(right.operationType);
    }

    return left.clientOperationId.localeCompare(right.clientOperationId);
  });
}

export async function listSyncOperations(
  storage: OfflineStorage,
): Promise<SyncOperation<unknown>[]> {
  return sortOperations(
    await storage.list<SyncOperation<unknown>>(`${OFFLINE_QUEUE_PREFIX}:`),
  );
}

export function buildQueueKey(clientOperationId: string): string {
  return `${OFFLINE_QUEUE_PREFIX}:${clientOperationId}`;
}

export async function enqueueOperation<TPayload>(
  storage: OfflineStorage,
  input: OfflineOperationInput<TPayload>,
): Promise<SyncOperation<TPayload>> {
  const createdAt = input.createdAt ?? Date.now();
  const clientOperationId =
    input.clientOperationId ??
    createClientOperationId(input.caseId, input.operationType, createdAt, input.payload);

  const existingKey = buildQueueKey(clientOperationId);
  const existing = await storage.getItem<SyncOperation<TPayload>>(existingKey);
  if (existing) {
    return existing;
  }

  const operation: SyncOperation<TPayload> = {
    clientOperationId,
    operationType: input.operationType,
    caseId: input.caseId,
    createdAt,
    payload: input.payload,
    status: "PENDING",
    retryCount: 0,
    lastAttemptAt: null,
    errorMessage: null,
  };

  await storage.setItem(existingKey, operation);
  return operation;
}

export async function getPendingOperations(
  storage: OfflineStorage,
  filter: QueueFilter = {},
): Promise<SyncOperation<unknown>[]> {
  const operations = await listSyncOperations(storage);

  return operations.filter((operation) => {
    if (filter.caseId && operation.caseId !== filter.caseId) {
      return false;
    }

    if (filter.operationType && operation.operationType !== filter.operationType) {
      return false;
    }

    if (filter.status && operation.status !== filter.status) {
      return false;
    }

    if (!filter.status) {
      return operation.status === "PENDING" || operation.status === "FAILED";
    }

    return true;
  });
}

export async function updateQueueOperation(
  storage: OfflineStorage,
  clientOperationId: string,
  updates: Partial<SyncOperation<unknown>>,
): Promise<SyncOperation<unknown> | null> {
  const key = buildQueueKey(clientOperationId);
  const existing = await storage.getItem<SyncOperation<unknown>>(key);

  if (!existing) {
    return null;
  }

  const updated: SyncOperation<unknown> = {
    ...existing,
    ...updates,
  };

  await storage.setItem(key, updated);
  return updated;
}

export async function markSyncing(
  storage: OfflineStorage,
  clientOperationId: string,
): Promise<SyncOperation<unknown> | null> {
  return updateQueueOperation(storage, clientOperationId, {
    status: "SYNCING",
    lastAttemptAt: Date.now(),
  });
}

export async function markSynced(
  storage: OfflineStorage,
  clientOperationId: string,
): Promise<SyncOperation<unknown> | null> {
  return updateQueueOperation(storage, clientOperationId, {
    status: "SYNCED",
    lastAttemptAt: Date.now(),
    errorMessage: null,
  });
}

export async function markFailed(
  storage: OfflineStorage,
  clientOperationId: string,
  errorMessage: string,
  maxRetries: number,
): Promise<SyncOperation<unknown> | null> {
  const existing = await storage.getItem<SyncOperation<unknown>>(buildQueueKey(clientOperationId));
  if (!existing) {
    return null;
  }

  const nextRetryCount = Math.min(existing.retryCount + 1, maxRetries);
  const status: SyncOperationStatus =
    nextRetryCount >= maxRetries ? "FAILED" : "FAILED";

  return updateQueueOperation(storage, clientOperationId, {
    status,
    retryCount: nextRetryCount,
    lastAttemptAt: Date.now(),
    errorMessage,
  });
}

export async function markConflict(
  storage: OfflineStorage,
  clientOperationId: string,
  errorMessage: string,
): Promise<SyncOperation<unknown> | null> {
  return updateQueueOperation(storage, clientOperationId, {
    status: "CONFLICT",
    lastAttemptAt: Date.now(),
    errorMessage,
  });
}

export async function retryFailedOperations(
  storage: OfflineStorage,
  maxRetries: number,
): Promise<SyncOperation<unknown>[]> {
  const operations = await getPendingOperations(storage);
  const retriable = operations.filter(
    (operation) => operation.status === "FAILED" && operation.retryCount < maxRetries,
  );

  await Promise.all(
    retriable.map(async (operation) => {
      await updateQueueOperation(storage, operation.clientOperationId, {
        status: "PENDING",
        errorMessage: null,
      });
    }),
  );

  return retriable;
}

export async function clearSyncedOperations(
  storage: OfflineStorage,
): Promise<number> {
  const operations = await listSyncOperations(storage);
  const synced = operations.filter((operation) => operation.status === "SYNCED");

  await Promise.all(
    synced.map((operation) => storage.removeItem(buildQueueKey(operation.clientOperationId))),
  );

  return synced.length;
}
