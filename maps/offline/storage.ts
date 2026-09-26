import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  OfflineCacheBucket,
  OfflineRecord,
  OfflineSyncMetadata,
} from "./types";

export type OfflineStorage = {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  list<T>(prefix: string): Promise<T[]>;
  clear(prefix: string): Promise<void>;
};

export type StorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
};

export const OFFLINE_STORAGE_PREFIX = "traceone:offline";
export const OFFLINE_CACHE_PREFIX = `${OFFLINE_STORAGE_PREFIX}:cache`;
export const OFFLINE_QUEUE_PREFIX = `${OFFLINE_STORAGE_PREFIX}:queue`;
export const OFFLINE_SYNC_METADATA_KEY = `${OFFLINE_STORAGE_PREFIX}:syncMetadata`;

export class AsyncStorageOfflineStorage implements OfflineStorage {
  constructor(private readonly storage: StorageLike = AsyncStorage) {}

  async getItem<T>(key: string): Promise<T | null> {
    const raw = await this.storage.getItem(key);
    if (raw == null || raw === "") {
      return null;
    }

    return JSON.parse(raw) as T;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    await this.storage.setItem(key, JSON.stringify(value));
  }

  async removeItem(key: string): Promise<void> {
    await this.storage.removeItem(key);
  }

  async list<T>(prefix: string): Promise<T[]> {
    const keys = await this.storage.getAllKeys();
    const matches = keys.filter((key) => key.startsWith(prefix));

    const records: Array<T | null> = await Promise.all(
      matches.map(async (key) => {
        const value = await this.getItem<T>(key);
        return value == null ? null : value;
      }),
    );

    return records.filter((record): record is T => record != null);
  }

  async clear(prefix: string): Promise<void> {
    const keys = await this.storage.getAllKeys();
    const matches = keys.filter((key) => key.startsWith(prefix));

    await Promise.all(matches.map((key) => this.storage.removeItem(key)));
  }
}

export function buildOfflineCacheKey(bucket: OfflineCacheBucket, id: string): string {
  return `${OFFLINE_CACHE_PREFIX}:${bucket}:${id}`;
}

export async function writeOfflineRecord<T>(
  storage: OfflineStorage,
  bucket: OfflineCacheBucket,
  id: string,
  data: T,
): Promise<OfflineRecord<T>> {
  const createdAt = Date.now();
  const record: OfflineRecord<T> = {
    id,
    data,
    createdAt,
    updatedAt: createdAt,
  };

  await storage.setItem(buildOfflineCacheKey(bucket, id), record);
  return record;
}

export async function readOfflineRecord<T>(
  storage: OfflineStorage,
  bucket: OfflineCacheBucket,
  id: string,
): Promise<OfflineRecord<T> | null> {
  return storage.getItem<OfflineRecord<T>>(buildOfflineCacheKey(bucket, id));
}

export async function listOfflineRecords<T>(
  storage: OfflineStorage,
  bucket: OfflineCacheBucket,
): Promise<OfflineRecord<T>[]> {
  return storage.list<OfflineRecord<T>>(`${OFFLINE_CACHE_PREFIX}:${bucket}:`);
}

export async function removeOfflineRecord(
  storage: OfflineStorage,
  bucket: OfflineCacheBucket,
  id: string,
): Promise<void> {
  await storage.removeItem(buildOfflineCacheKey(bucket, id));
}

export async function readSyncMetadata(
  storage: OfflineStorage,
): Promise<OfflineSyncMetadata> {
  const saved = await storage.getItem<OfflineSyncMetadata>(OFFLINE_SYNC_METADATA_KEY);

  return saved ?? {
    lastSuccessfulSyncAt: null,
    lastAttemptAt: null,
    pendingCount: 0,
    lastOperationId: null,
  };
}

export async function writeSyncMetadata(
  storage: OfflineStorage,
  metadata: OfflineSyncMetadata,
): Promise<void> {
  await storage.setItem(OFFLINE_SYNC_METADATA_KEY, metadata);
}
