export type ConflictCategory =
  | "DUPLICATE_OPERATION"
  | "STALE_UPDATE"
  | "VERSION_CONFLICT"
  | "ASSIGNMENT_CONFLICT"
  | "SESSION_CONFLICT"
  | "EVIDENCE_CONFLICT"
  | "UNKNOWN";

export type ConflictStatus =
  | "DETECTED"
  | "PENDING_REVIEW"
  | "RESOLVED"
  | "REJECTED";

export type ConflictResolutionDecision =
  | "IGNORE_DUPLICATE"
  | "PRESERVE_REMOTE"
  | "PRESERVE_BOTH"
  | "KEEP_LOCAL_HISTORY"
  | "REQUIRE_REVIEW"
  | "REJECTED";

export type ConflictResolution = {
  decision: ConflictResolutionDecision;
  status: ConflictStatus;
  resolvedAt: number;
  reason: string;
  metadata: Record<string, unknown>;
};

export type ConflictRecord<TLocal = unknown, TRemote = unknown> = {
  conflictId: string;
  caseId: string;
  clientOperationId?: string | null;
  entityType: string;
  entityId: string;
  conflictType: ConflictCategory;
  localData: TLocal;
  remoteData: TRemote;
  detectedAt: number;
  status: ConflictStatus;
  resolution: ConflictResolution | null;
};

export type ConflictDetectionInput<TLocal = unknown, TRemote = unknown> = {
  caseId: string;
  clientOperationId?: string | null;
  entityType: string;
  entityId: string;
  conflictType: ConflictCategory;
  localData: TLocal;
  remoteData: TRemote;
  detectedAt?: number;
  status?: ConflictStatus;
};

export function createConflictId(
  caseId: string,
  entityType: string,
  entityId: string,
  detectedAt: number,
): string {
  return `${caseId}:${entityType}:${entityId}:${detectedAt}`;
}

export function createConflictRecord<TLocal, TRemote>(
  input: ConflictDetectionInput<TLocal, TRemote>,
): ConflictRecord<TLocal, TRemote> {
  const detectedAt = input.detectedAt ?? Date.now();

  return {
    conflictId: createConflictId(input.caseId, input.entityType, input.entityId, detectedAt),
    caseId: input.caseId,
    clientOperationId: input.clientOperationId ?? null,
    entityType: input.entityType,
    entityId: input.entityId,
    conflictType: input.conflictType,
    localData: input.localData,
    remoteData: input.remoteData,
    detectedAt,
    status: input.status ?? "DETECTED",
    resolution: null,
  };
}
