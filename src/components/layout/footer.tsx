import Link from "next/link";
import { PawPathLogo } from "@/components/layout/pawpath-logo";
import { APP_NAME, LIABILITY_DISCLAIMER } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-sand-200/80 bg-white/40 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <PawPathLogo showTagline={false} size="sm" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-sand-600">
              A local connection platform for dog owners and walkers. Not a
              booking service. Not a payment processor.
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-sand-500">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-sand-700">
              <li>
                <Link
                  href="/find"
                  className="transition hover:text-trail-700"
                >
                  Find walkers
                </Link>
              </li>
              <li>
                <Link
                  href="/for-walkers"
                  className="transition hover:text-trail-700"
                >
                  List your services
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="transition hover:text-trail-700"
                >
                  How it works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-sand-500">
              Legal
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-sand-700">
              <li>
                <Link
                  href="/legal/terms"
                  className="transition hover:text-trail-700"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/disclaimer"
                  className="transition hover:text-trail-700"
                >
                  Liability Disclaimer
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="transition hover:text-trail-700"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-12 border-t border-sand-200/80 pt-8 text-xs leading-relaxed text-sand-500">
          {LIABILITY_DISCLAIMER}
        </p>
        <p className="mt-3 text-xs text-sand-400">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
