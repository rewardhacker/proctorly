export const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];

export function assertValidFile(file: File) {
  if (!file || file.size === 0) throw new Error("File is required");
  if (file.size > MAX_FILE_BYTES) throw new Error("File exceeds 10MB limit");
  if (!ALLOWED_MIME.includes(file.type)) throw new Error("Only PDF files are accepted");
}
