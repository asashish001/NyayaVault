import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { StorageAdapter } from "./types";
import { env } from "@/lib/env";

const ALGO = "aes-256-gcm";
// Must be 32 bytes hex encoded in env
const KEY = Buffer.from(env.encryptionKey, "hex");

export class FilesystemStorageAdapter implements StorageAdapter {
  private rootDir: string;

  constructor() {
    this.rootDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), env.storageRoot);
  }

  private async ensureDir() {
    await fs.mkdir(this.rootDir, { recursive: true });
  }

  async put(key: string, buffer: Buffer, mimeType: string) {
    await this.ensureDir();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    // Store IV (16) + AuthTag (16) + encrypted data
    const finalData = Buffer.concat([iv, authTag, encrypted]);
    const filePath = path.join(this.rootDir, key);
    await fs.writeFile(filePath, finalData);

    return {
      key,
      byteLength: finalData.length
    };
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.stat(path.join(this.rootDir, key));
      return true;
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<Buffer> {
    const filePath = path.join(this.rootDir, key);
    const fileData = await fs.readFile(filePath);

    // Extract IV (first 16 bytes), AuthTag (next 16 bytes), and encrypted data
    const iv = fileData.subarray(0, 16);
    const authTag = fileData.subarray(16, 32);
    const encrypted = fileData.subarray(32);

    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted;
  }
}
