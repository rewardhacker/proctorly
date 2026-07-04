import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { StorageAdapter } from "./types";

const ROOT = path.join(process.cwd(), "uploads");

function sign(key: string, exp: number) {
  return crypto
    .createHmac("sha256", process.env.AUTH_SECRET!)
    .update(`${key}:${exp}`)
    .digest("base64url");
}

export function verifyLocalUploadToken(key: string, exp: number, token: string) {
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  return sign(key, exp) === token;
}

export const localStorage: StorageAdapter = {
  async put(key, data) {
    const filePath = path.join(ROOT, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
  },
  async read(key) {
    return fs.readFile(path.join(ROOT, key));
  },
  async delete(key) {
    await fs.rm(path.join(ROOT, key), { force: true });
  },
  // Dev-only stand-in for a presigned URL: a short-lived HMAC-signed link
  // to our own /api/local-upload route, so local dev exercises the same
  // "browser uploads directly, server never sees the bytes" shape as prod.
  async getUploadUrl(key) {
    const exp = Date.now() + 5 * 60_000;
    const token = sign(key, exp);
    return `/api/local-upload?key=${encodeURIComponent(key)}&exp=${exp}&token=${token}`;
  },
};
