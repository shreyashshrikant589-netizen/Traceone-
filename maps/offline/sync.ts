import { readSyncMetadata, writeSyncMetadata, type OfflineStorage } from "./storage";
import {
  getPendingOperations,
  markConflict,
  markFailed,
  markSynced,
  markSyncing,
  retryFailedOperations,
} from "./queue";
import type { ConnectivityState, SyncOperation, SyncTransportResult } from "./types";

export type SyncTransport = {
  send(operation: SyncOperation<unknown>): Promise<SyncTransportResult>;
};

export class NoopSyncTransport implements SyncTransport {
  async send(operation: SyncOperation<unknown>): Promise<SyncTransportResult> {
    const status = operation.status === "CONFLICT" ? "CONFLICT" : "SYNCED";

    return {
      accepted: true,
      status,
      errorMessage: status === "SYNCED" ? undefined : "No backend transport configured.",
    };
  }
}

export type OfflineSyncEngineConfig = {
  storage: OfflineStorage;
  transport: SyncTransport;
  maxRetries: number;
  retryDelayMs?: number;
};

export class OfflineSyncEngine {
  private readonly storage: OfflineStorage;
  private readonly transport: SyncTransport;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(config: OfflineSyncEngineConfig) {
    this.storage = config.storage;
    this.transport = config.transport;
    this.maxRetries = config.maxRetries;
    this.retryDelayMs = config.retryDelayMs ?? 1000;
  }

  async syncOnce(): Promise<SyncOperation<unknown>[]> {
    try {
      await retryFailedOperations(this.storage, this.maxRetries);

      const pendingOperations = await getPendingOperations(this.storage);
      const candidates = pendingOperations.filter(
        (operation) =>
          operation.status === "PENDING" ||
          (operation.status === "FAILED" && operation.retryCount < this.maxRetries),
      );

      const results: SyncOperation<unknown>[] = [];
      const metadata = await readSyncMetadata(this.storage);

      for (const operation of candidates) {
        try {
          await markSyncing(this.storage, operation.clientOperationId);

          const result = await this.transport.send(operation);

          if (result.status === "CONFLICT" || result.conflict) {
            const conflictMessage =
              result.errorMessage ?? result.conflict?.message ?? "Conflict reported by server.";
            const updated = await markConflict(
              this.storage,
              operation.clientOperationId,
              conflictMessage,
            );
            if (updated) {
              results.push(updated);
            }
            continue;
          }

          if (result.status === "FAILED" || result.accepted === false) {
            const failureMessage = result.errorMessage ?? "Sync failed.";
            const updated = await markFailed(
              this.storage,
              operation.clientOperationId,
              failureMessage,
              this.maxRetries,
            );
            if (updated) {
              results.push(updated);
            }
            continue;
          }

          const updated = await markSynced(this.storage, operation.clientOperationId);
          if (updated) {
            results.push(updated);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown sync error.";
          const updated = await markFailed(
            this.storage,
            operation.clientOperationId,
            message,
            this.maxRetries,
          );
          if (updated) {
            results.push(updated);
          }
        }
      }

      const nextMetadata = {
        ...metadata,
        lastAttemptAt: Date.now(),
        pendingCount: results.filter((operation) => operation.status !== "SYNCED").length,
        lastOperationId: results.at(-1)?.clientOperationId ?? metadata.lastOperationId,
      };

      if (results.some((operation) => operation.status === "SYNCED")) {
        nextMetadata.lastSuccessfulSyncAt = Date.now();
      }

      await writeSyncMetadata(this.storage, nextMetadata);
      return results;
    } catch {
      return [];
    }
  }

  async handleConnectivityChange(state: ConnectivityState): Promise<SyncOperation<unknown>[]> {
    if (state !== "ONLINE") {
      return [];
    }

    return this.syncOnce();
  }

  async resume(): Promise<SyncOperation<unknown>[]> {
    return this.syncOnce();
  }
}
