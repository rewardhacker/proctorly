export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";

export default async function TutorDashboard() {
  const session = await auth();

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-xl font-semibold">Welcome, {session!.user.name}</h1>
      <p className="mt-2 text-sm text-gray-600">
        Use the nav above to manage papers, tutees, and grading.
      </p>
    </main>
  );
}
