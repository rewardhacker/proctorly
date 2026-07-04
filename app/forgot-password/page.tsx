"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/lib/actions";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await requestPasswordReset(new FormData(e.currentTarget));
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="w-80 rounded-lg border p-6 text-center">
          <h1 className="mb-2 text-lg font-semibold">Check your email</h1>
          <p className="text-sm text-gray-600">
            If that address is registered, a reset link has been sent. It expires in 1 hour.
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm underline">
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
