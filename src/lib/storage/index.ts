import { FilesystemStorageAdapter } from "./filesystem";
import { storageAdapterName, type StorageAdapter } from "./types";

let adapterInstance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!adapterInstance) {
    // Easily extensible for AWS S3, MinIO, etc. based on storageAdapterName
    if (storageAdapterName === "filesystem") {
      adapterInstance = new FilesystemStorageAdapter();
    } else {
      // Fallback to filesystem for demo if unknown
      adapterInstance = new FilesystemStorageAdapter();
    }
  }
  
  return adapterInstance;
}

export * from "./types";
