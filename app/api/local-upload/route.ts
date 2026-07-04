import { localStorage, verifyLocalUploadToken } from "@/lib/storage/local";

export async function PUT(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const exp = Number(url.searchParams.get("exp"));
  const token = url.searchParams.get("token");

  if (!key || !token || !verifyLocalUploadToken(key, exp, token)) {
    return new Response("Forbidden", { status: 403 });
  }

  const contentType = req.headers.get("content-type") || "application/octet-stream";
  const data = Buffer.from(await req.arrayBuffer());
  await localStorage.put(key, data, contentType);

  return new Response(null, { status: 200 });
}
