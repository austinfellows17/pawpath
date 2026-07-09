"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit-log", label: "Audit log" },
  { href: "/admin/background-checks", label: "Background checks" },
  { href: "/admin/queues", label: "Moderation" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-sand-200 pb-4">
      {links.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              active
                ? "bg-trail-700 text-white"
                : "bg-sand-100 text-sand-700 hover:bg-sand-200"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
