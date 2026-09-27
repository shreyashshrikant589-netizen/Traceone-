export type OfflineCacheBucket =
  | "cases"
  | "searchBoundaries"
  | "searchZones"
  | "volunteerAssignments"
  | "searchSessions"
  | "gpsRecords"
  | "sightings"
  | "syncMetadata"
  | "pendingOperations";

export type ConnectivityState = "ONLINE" | "OFFLINE" | "UNKNOWN";

export type SyncOperationStatus =
  | "PENDING"
  | "SYNCING"
  | "SYNCED"
  | "FAILED"
  | "CONFLICT";

export type SyncOperation<TPayload = Record<string, unknown>> = {
  clientOperationId: string;
  operationType: string;
  caseId: string;
  createdAt: number;
  payload: TPayload;
  status: SyncOperationStatus;
  retryCount: number;
  lastAttemptAt: number | null;
  errorMessage: string | null;
};

export type SyncConflict = {
  kind: "CONFLICT";
  message: string;
  authoritativeField?: string | null;
  serverVersion?: number | null;
  localVersion?: number | null;
};

export type SyncTransportResult = {
  accepted: boolean;
  status: "SYNCED" | "FAILED" | "CONFLICT";
  conflict?: SyncConflict | null;
  errorMessage?: string | null;
};

export type OfflineRecord<T> = {
  id: string;
  data: T;
  createdAt: number;
  updatedAt: number;
};

export type OfflineSyncMetadata = {
  lastSuccessfulSyncAt: number | null;
  lastAttemptAt: number | null;
  pendingCount: number;
  lastOperationId: string | null;
};

export type QueueFilter = {
  caseId?: string;
  operationType?: string;
  status?: SyncOperationStatus;
};

export type OfflineOperationInput<TPayload> = {
  caseId: string;
  operationType: string;
  payload: TPayload;
  createdAt?: number;
  clientOperationId?: string;
};
