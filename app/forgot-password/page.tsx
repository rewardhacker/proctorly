"use client";

import { useState, useEffect } from "react";
import { requestPasswordReset } from "@/lib/actions";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function send(emailToSend: string) {
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("email", emailToSend);
    try {
      await requestPasswordReset(fd);
      setSent(true);
      setCountdown(60);
    } catch {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const emailVal = (new FormData(e.currentTarget).get("email") as string);
    setEmail(emailVal);
    await send(emailVal);
  }

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="w-80 rounded-lg border p-6 text-center flex flex-col gap-4">
          <h1 className="text-lg font-semibold">Check your email</h1>
          <p className="text-sm text-gray-600">
            If that address is registered, a reset link has been sent. It expires in 1 hour.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {countdown > 0 ? (
            <p className="text-sm text-gray-400">Resend in {countdown}s</p>
          ) : (
            <button
              onClick={() => send(email)}
              disabled={loading}
              className="rounded bg-foreground px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {loading ? "Sending…" : "Resend link"}
            </button>
          )}
          <Link href="/login" className="text-sm text-gray-500 underline">
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <form onSubmit={onSubmit} className="flex w-80 flex-col gap-4 rounded-lg border p-6">
        <h1 className="text-lg font-semibold">Forgot Password</h1>
        <p className="text-sm text-gray-600">
          Enter your tutor email and we&apos;ll send a reset link.
        </p>
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded border px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-foreground px-3 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send Reset Link"}
        </button>
        <Link href="/login" className="text-center text-sm text-gray-500 underline">
          Back to login
        </Link>
      </form>
    </main>
  );
}
