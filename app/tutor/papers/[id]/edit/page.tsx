export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import EditPaperForm from "./EditPaperForm";

export default async function EditPaperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const paper = await prisma.paper.findFirst({
    where: { id, tutorId: session!.user.id },
    select: { id: true, title: true, subject: true, paperVariant: true, defaultDurationMins: true, numQuestions: true },
  });

  if (!paper) notFound();

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Edit Paper</h1>
      <EditPaperForm paper={paper} />
    </main>
  );
}
