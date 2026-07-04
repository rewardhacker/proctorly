import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "tutee_session";

function sign(payload: string) {
  return crypto
    .createHmac("sha256", process.env.AUTH_SECRET!)
    .update(payload)
    .digest("base64url");
}

export async function setTuteeSession(tuteeId: string) {
  const payload = Buffer.from(JSON.stringify({ tuteeId })).toString("base64url");
  const signature = sign(payload);
  (await cookies()).set(COOKIE_NAME, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 6,
  });
}

export async function getTuteeSession(): Promise<{ tuteeId: string } | null> {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [payload, signature] = raw.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}
