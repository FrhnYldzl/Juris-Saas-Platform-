import { promises as fs } from "node:fs";
import path from "node:path";
import { logger } from "@/lib/logger";

/**
 * Storage abstraction.
 *   STORAGE_DRIVER=local (default) → filesystem (Railway Volume)
 *   STORAGE_DRIVER=s3 → v0.3+ will add S3-compatible driver
 *
 * Files are stored under `<root>/<firmId>/<documentId><ext>`. The DB row
 * carries storageKey (relative path) and mime type.
 */

export interface StoragePutOptions {
  firmId: string;
  documentId: string;
  filename: string;
  contentType: string;
  bytes: Buffer;
}

export interface StorageDriver {
  put(opts: StoragePutOptions): Promise<{ storageKey: string; size: number }>;
  get(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}

// ------------- Local filesystem driver -------------

const LOCAL_ROOT = process.env.STORAGE_LOCAL_PATH
  ? path.resolve(process.env.STORAGE_LOCAL_PATH)
  : path.resolve(process.cwd(), "storage");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

const localDriver: StorageDriver = {
  async put({ firmId, documentId, filename, bytes }) {
    const ext = path.extname(filename) || "";
    const safeId = documentId.replace(/[^a-zA-Z0-9-]/g, "");
    const key = path.posix.join(firmId, `${safeId}${ext}`);
    const target = path.join(LOCAL_ROOT, key);
    await ensureDir(path.dirname(target));
    await fs.writeFile(target, bytes);
    logger.debug({ key, size: bytes.length }, "storage.local.put");
    return { storageKey: key, size: bytes.length };
  },

  async get(storageKey) {
    const target = path.join(LOCAL_ROOT, storageKey);
    return fs.readFile(target);
  },

  async delete(storageKey) {
    const target = path.join(LOCAL_ROOT, storageKey);
    try {
      await fs.unlink(target);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  },
};

// ------------- Driver resolver -------------

export function getStorage(): StorageDriver {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "local") return localDriver;
  throw new Error(
    `Storage driver '${driver}' is not implemented yet. Use STORAGE_DRIVER=local.`,
  );
}

// ------------- Helpers -------------

export const ALLOWED_DOC_TYPES = new Set<string>([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "text/plain",
  "text/csv",
]);

export const MAX_DOC_BYTES = 25 * 1024 * 1024; // 25 MB

export function categorizeDoc(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if ([".pdf"].includes(ext)) return "pdf";
  if ([".doc", ".docx"].includes(ext)) return "word";
  if ([".xls", ".xlsx", ".csv"].includes(ext)) return "spreadsheet";
  if ([".ppt", ".pptx"].includes(ext)) return "presentation";
  if ([".jpg", ".jpeg", ".png", ".webp", ".heic"].includes(ext)) return "image";
  return "other";
}
