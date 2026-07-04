"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    window.location.href = "/tutor";
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <form
        action={onSubmit}
        className="flex w-80 flex-col gap-4 rounded-lg border p-6"
      >
        <h1 className="text-lg font-semibold">Tutor Login</h1>
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
          className="rounded bg-foreground px-3 py-2 text-white"
        >
          Log In
        </button>
      </form>
    </main>
  );
}
