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
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-8 py-3">
        <nav className="flex flex-wrap gap-2">
          {LINKS.map((link) => {
            const active =
              link.href === "/tutor" ? pathname === "/tutor" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded px-3 py-1.5 text-sm ${
                  active ? "bg-foreground text-white" : "hover:bg-highlight/20"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <form action={logoutAction}>
          <button type="submit" className="rounded bg-red-900 px-3 py-1.5 text-sm text-white hover:bg-red-800">
            Log Out
          </button>
        </form>
      </div>
    </header>
  );
}
