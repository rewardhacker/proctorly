import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TutorNav from "@/components/TutorNav";

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-full">
      <TutorNav isAdmin={session.user.isAdmin} />
      {children}
    </div>
  );
}
