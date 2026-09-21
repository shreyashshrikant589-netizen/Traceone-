import type {
  ConflictCategory,
  ConflictRecord,
  ConflictResolution,
  ConflictResolutionDecision,
  ConflictStatus,
} from "./types";

export type ConflictResolutionContext = {
  remoteAuthoritative: boolean;
  preserveLocalHistory: boolean;
  preserveBoth: boolean;
};

export type ConflictResolver<TLocal = unknown, TRemote = unknown> = {
  detectConflict(
    caseId: string,
    entityType: string,
    entityId: string,
    conflictType: ConflictCategory,
    localData: TLocal,
    remoteData: TRemote,
    clientOperationId?: string | null,
  ): ConflictRecord<TLocal, TRemote> | null;
  resolveConflict(conflict: ConflictRecord<TLocal, TRemote>): ConflictResolution;
};

export function defaultResolutionContext(
  conflictType: ConflictCategory,
): ConflictResolutionContext {
  switch (conflictType) {
    case "DUPLICATE_OPERATION":
      return {
        remoteAuthoritative: false,
        preserveLocalHistory: false,
        preserveBoth: false,
      };
    case "STALE_UPDATE":
      return {
        remoteAuthoritative: true,
        preserveLocalHistory: false,
        preserveBoth: false,
      };
    case "ASSIGNMENT_CONFLICT":
      return {
        remoteAuthoritative: true,
        preserveLocalHistory: false,
        preserveBoth: false,
      };
    case "SESSION_CONFLICT":
      return {
        remoteAuthoritative: false,
        preserveLocalHistory: true,
        preserveBoth: false,
      };
    case "EVIDENCE_CONFLICT":
      return {
        remoteAuthoritative: false,
        preserveLocalHistory: false,
        preserveBoth: true,
      };
    case "VERSION_CONFLICT":
      return {
        remoteAuthoritative: true,
        preserveLocalHistory: false,
        preserveBoth: false,
      };
    default:
      return {
        remoteAuthoritative: false,
        preserveLocalHistory: false,
        preserveBoth: false,
      };
  }
}

export function resolveConflict<TLocal, TRemote>(
  conflict: ConflictRecord<TLocal, TRemote>,
): ConflictResolution {
  const context = defaultResolutionContext(conflict.conflictType);
  const metadata: Record<string, unknown> = {
    entityType: conflict.entityType,
    entityId: conflict.entityId,
    caseId: conflict.caseId,
    clientOperationId: conflict.clientOperationId ?? null,
  };

  switch (conflict.conflictType) {
    case "DUPLICATE_OPERATION":
      return {
        decision: "IGNORE_DUPLICATE",
        status: "RESOLVED",
        resolvedAt: Date.now(),
        reason: "Duplicate operation confirmed; no destructive action taken.",
        metadata,
      };
    case "STALE_UPDATE":
      return {
        decision: context.remoteAuthoritative ? "PRESERVE_REMOTE" : "REQUIRE_REVIEW",
        status: "REJECTED",
        resolvedAt: Date.now(),
        reason: "Remote authoritative state is preserved for stale updates.",
        metadata,
      };
    case "VERSION_CONFLICT":
      return {
        decision: context.remoteAuthoritative ? "PRESERVE_REMOTE" : "REQUIRE_REVIEW",
        status: "PENDING_REVIEW",
        resolvedAt: Date.now(),
        reason: "Version conflict requires review before any overwrite is allowed.",
        metadata,
      };
    case "ASSIGNMENT_CONFLICT":
      return {
        decision: context.remoteAuthoritative ? "PRESERVE_REMOTE" : "REQUIRE_REVIEW",
        status: "PENDING_REVIEW",
        resolvedAt: Date.now(),
        reason: "Assignment state remains backend-authoritative until a manager decision is recorded.",
        metadata,
      };
    case "SESSION_CONFLICT":
      return {
        decision: context.preserveLocalHistory ? "KEEP_LOCAL_HISTORY" : "REQUIRE_REVIEW",
        status: "PENDING_REVIEW",
        resolvedAt: Date.now(),
        reason: "Session history is preserved locally and must be reviewed before merge.",
        metadata,
      };
    case "EVIDENCE_CONFLICT":
      return {
        decision: context.preserveBoth ? "PRESERVE_BOTH" : "REQUIRE_REVIEW",
        status: "PENDING_REVIEW",
        resolvedAt: Date.now(),
        reason: "Evidence versions are preserved for manual review; neither side is overwritten automatically.",
        metadata,
      };
    default:
      return {
        decision: "REQUIRE_REVIEW",
        status: "DETECTED",
        resolvedAt: Date.now(),
        reason: "Unclassified conflict requires explicit review.",
        metadata,
      };
  }
}

export function detectConflict<TLocal, TRemote>(
  caseId: string,
  entityType: string,
  entityId: string,
  conflictType: ConflictCategory,
  localData: TLocal,
  remoteData: TRemote,
  clientOperationId?: string | null,
): ConflictRecord<TLocal, TRemote> | null {
  if (!caseId || !entityType || !entityId) {
    return null;
  }

  const detectedAt = Date.now();

  return {
    conflictId: `${caseId}:${entityType}:${entityId}:${detectedAt}`,
    caseId,
    clientOperationId: clientOperationId ?? null,
    entityType,
    entityId,
    conflictType,
    localData,
    remoteData,
    detectedAt,
    status: "DETECTED",
    resolution: null,
  };
}

export class DefaultConflictResolver implements ConflictResolver {
  detectConflict<TLocal, TRemote>(
    caseId: string,
    entityType: string,
    entityId: string,
    conflictType: ConflictCategory,
    localData: TLocal,
    remoteData: TRemote,
    clientOperationId?: string | null,
  ): ConflictRecord<TLocal, TRemote> | null {
    return detectConflict(
      caseId,
      entityType,
      entityId,
      conflictType,
      localData,
      remoteData,
      clientOperationId,
    );
  }

  resolveConflict<TLocal, TRemote>(
    conflict: ConflictRecord<TLocal, TRemote>,
  ): ConflictResolution {
    return resolveConflict(conflict);
  }
}
