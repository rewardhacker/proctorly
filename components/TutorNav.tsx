"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";

const LINKS = [
  { href: "/tutor", label: "Dashboard" },
  { href: "/tutor/papers", label: "Papers" },
  { href: "/tutor/tutees", label: "Tutees & Invite Links" },
  { href: "/tutor/attempts", label: "Submissions & Grading" },
];

export default function TutorNav() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-emphasis">
      <div className="mx-auto flex max-w-5xl items-start justify-between gap-3 px-8 py-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4 lg:gap-24">
          <Link href="/tutor" className="font-[family-name:var(--font-arima-madurai)] text-xl font-bold tracking-tight">Proctorly</Link>
          <nav className="flex flex-wrap gap-2">
            {LINKS.map((link) => {
              const active =
                link.href === "/tutor" ? pathname === "/tutor" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded border px-3 py-1.5 text-sm ${
                    active ? "border-foreground bg-foreground text-white" : "border-gray-300 hover:bg-highlight/20"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="rounded bg-red-900 px-3 py-1.5 text-sm text-white hover:bg-red-800">
            Log Out
          </button>
        </form>
      </div>
    </header>
  );
}
