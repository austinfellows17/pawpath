"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { PawPathLogo } from "@/components/layout/pawpath-logo";
import { Menu, X } from "lucide-react";

function UnreadMessagesBadge() {
  const { data: session } = useSession();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!session?.user) return;

    const load = () => {
      void fetch("/api/messages/unread-count")
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (data) setCount(data.count);
        });
    };

    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [session?.user]);

  if (!count) return null;

  return (
    <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-semibold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function Header() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/find", label: "Find walkers" },
    { href: "/for-walkers", label: "For walkers" },
    { href: "/how-it-works", label: "How it works" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-sand-50/75 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <PawPathLogo showTagline={false} />

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium text-trail-800/90 transition hover:text-trail-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              <Button href="/messages" variant="ghost" size="sm">
                Messages
                <UnreadMessagesBadge />
              </Button>
              <Button href="/dashboard" variant="ghost" size="sm">
                Dashboard
              </Button>
              <Button href="/api/auth/signout" variant="outline" size="sm">
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button href="/login" variant="ghost" size="sm">
                Log in
              </Button>
              <Button href="/signup" size="sm">
                Get started
              </Button>
            </>
          )}
        </div>

        <button
          className="rounded-xl p-2.5 text-trail-800 transition hover:bg-white/60 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="glass border-t border-white/50 px-4 py-5 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-trail-800 transition hover:bg-white/60"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-3 border-sand-200/80" />
            {session ? (
              <>
                <Link
                  href="/messages"
                  className="rounded-xl px-3 py-2.5 text-sm font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  Messages
                  <UnreadMessagesBadge />
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-xl px-3 py-2.5 text-sm font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/api/auth/signout"
                  className="rounded-xl px-3 py-2.5 text-sm font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign out
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3 py-2.5 text-sm font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-trail-700"
                  onClick={() => setMobileOpen(false)}
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
