"use client";

import { useState } from "react";
import { use } from "react";
import { completePasswordReset } from "@/lib/actions";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("token", token);
    const result = await completePasswordReset(fd);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // on success, completePasswordReset redirects to /login
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <form onSubmit={onSubmit} className="flex w-80 flex-col gap-4 rounded-lg border p-6">
        <h1 className="text-lg font-semibold">Set New Password</h1>
        <input
          name="password"
          type="password"
          placeholder="New password (min 8 characters)"
          required
          minLength={8}
          className="rounded border px-3 py-2"
        />
        <input
          name="confirm"
          type="password"
          placeholder="Confirm password"
          required
          className="rounded border px-3 py-2"
          onInput={(e) => {
            const form = (e.target as HTMLInputElement).form!;
            const pw = form.elements.namedItem("password") as HTMLInputElement;
            (e.target as HTMLInputElement).setCustomValidity(
              (e.target as HTMLInputElement).value !== pw.value ? "Passwords do not match" : "",
            );
          }}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-foreground px-3 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Saving…" : "Set Password"}
        </button>
      </form>
    </main>
  );
}
