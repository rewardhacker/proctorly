export interface StorageAdapter {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  // A short-lived URL the browser can PUT bytes to directly, bypassing the
  // Next.js server entirely for the file body.
  getUploadUrl(key: string, contentType: string): Promise<string>;
}
