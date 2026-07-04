import { getTuteeSession } from "@/lib/tuteeSession";
import { redirect } from "next/navigation";
import { studentLogout } from "@/lib/actions";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getTuteeSession();
  if (!session) redirect("/student/login");

  return (
    <div className="min-h-full">
      <nav className="flex items-center justify-between border-b px-6 py-3">
        <span className="font-semibold">My Papers</span>
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
