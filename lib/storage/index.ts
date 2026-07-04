import { localStorage } from "./local";
import { s3Storage } from "./s3";
import { StorageAdapter } from "./types";

// STORAGE_DRIVER=s3 switches to S3/R2 (see s3.ts for required env vars).
// Defaults to local disk, which only works with a persistent filesystem
// (a VM/container), not serverless deployments like Vercel.
export const storage: StorageAdapter =
  process.env.STORAGE_DRIVER === "s3" ? s3Storage : localStorage;
