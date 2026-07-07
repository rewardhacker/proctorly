import { getTuteeSession } from "@/lib/tuteeSession";
import { redirect } from "next/navigation";
import { studentLogout } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getTuteeSession();
  if (!session) redirect("/student/login");

  const tutee = await prisma.tutee.findUnique({ where: { id: session.tuteeId }, select: { analyticsSharedWithStudent: true } });

  return (
    <div className="min-h-full">
      <nav className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href="/student" className="font-semibold hover:opacity-75">My Papers</Link>
          {tutee?.analyticsSharedWithStudent && (
            <Link href="/student/analytics" className="text-sm text-gray-600 hover:text-gray-900">
              Analytics
            </Link>
          )}
        </div>
        <form action={studentLogout}>
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-800">
            Log Out
          </button>
        </form>
      </nav>
      {children}
    </div>
  );
}
