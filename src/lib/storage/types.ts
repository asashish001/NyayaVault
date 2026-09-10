export type StoredObject = {
  key: string;
  byteLength: number;
};

export interface StorageAdapter {
  put(key: string, bytes: Buffer, contentType: string): Promise<StoredObject>;
  get(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
}

/** Filesystem adapter used for local demo. MinIO/S3 adapter is a later swap. */
export const storageAdapterName = process.env.STORAGE_ADAPTER ?? "filesystem";
