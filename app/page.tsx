import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex w-72 flex-col gap-4 rounded-lg border p-8 text-center">
        <h1 className="text-xl font-semibold">Proctorly</h1>
        <p className="text-sm text-gray-500">Who are you logging in as?</p>
        <Link
          href="/login"
          className="rounded bg-foreground px-4 py-2 text-white"
        >
          Tutor
        </Link>
        <Link
          href="/student/login"
          className="rounded border px-4 py-2"
        >
          Student
        </Link>
      </div>
    </main>
  );
}
