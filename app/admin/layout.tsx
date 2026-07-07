import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TutorNav from "@/components/TutorNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/tutor");

  return (
    <div className="min-h-full">
      <TutorNav isAdmin />
      {children}
    </div>
  );
}
