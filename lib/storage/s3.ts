import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageAdapter } from "./types";

// Works against AWS S3 or any S3-compatible provider (Cloudflare R2,
// Backblaze B2, MinIO) via a configurable endpoint. Select with
// STORAGE_DRIVER=s3 and set S3_BUCKET / S3_REGION / S3_ENDPOINT (optional,
// for non-AWS providers) / AWS credentials via the usual env vars.
const client = new S3Client({
  region: process.env.S3_REGION ?? "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials:
    process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        }
      : undefined,
});

const bucket = process.env.S3_BUCKET ?? "";

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export const s3Storage: StorageAdapter = {
  async put(key, data, contentType) {
    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: data, ContentType: contentType }),
    );
  },
  async read(key) {
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return streamToBuffer(res.Body as NodeJS.ReadableStream);
  },
  async delete(key) {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  },
  // ponytail: plain presigned PUT, not a createPresignedPost policy — so
  // there's no server-enforced size cap on this path (only the client-side
  // check in the upload form). Upgrade to createPresignedPost with a
  // content-length-range condition if that gap matters later.
  async getUploadUrl(key, contentType) {
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    return getSignedUrl(client, command, { expiresIn: 300 });
  },
};
