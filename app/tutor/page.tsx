import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TutorDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-8">
      <h1 className="text-xl font-semibold">Welcome, {session.user.name}</h1>
      <nav className="flex flex-col gap-2">
        <Link href="/tutor/papers" className="rounded bg-foreground px-4 py-2 text-center text-white">
          Papers
        </Link>
        <Link href="/tutor/tutees" className="rounded bg-foreground px-4 py-2 text-center text-white">
          Tutees &amp; Invite Links
        </Link>
        <Link href="/tutor/attempts" className="rounded bg-foreground px-4 py-2 text-center text-white">
          Submissions &amp; Grading
        </Link>
      </nav>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button type="submit" className="rounded border px-3 py-2">
          Log Out
        </button>
      </form>
    </main>
  );
}
