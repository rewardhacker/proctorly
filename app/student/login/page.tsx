"use client";

import { useState } from "react";
import { studentLogin } from "@/lib/actions";

export default function StudentLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await studentLogin(new FormData(e.currentTarget));
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // on success, studentLogin redirects – no further handling needed
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <form onSubmit={onSubmit} className="flex w-80 flex-col gap-4 rounded-lg border p-6">
        <h1 className="text-lg font-semibold">Student Login</h1>
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded border px-3 py-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="rounded border px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-foreground px-3 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Logging in…" : "Log In"}
        </button>
      </form>
    </main>
  );
}
