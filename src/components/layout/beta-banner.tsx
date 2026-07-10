import { BETA_NOTICE } from "@/lib/constants";

export function isBetaBannerEnabled() {
  return process.env.NEXT_PUBLIC_SHOW_BETA_BANNER?.trim() !== "false";
}

export function BetaBanner() {
  if (!isBetaBannerEnabled()) {
    return null;
  }

  return (
    <div
      className="border-b border-trail-200/50 bg-trail-50/90"
      role="status"
      aria-label={BETA_NOTICE.message}
    >
      <div className="mx-auto max-w-6xl px-4 py-2.5 text-center sm:px-6">
        <p className="text-sm leading-relaxed text-trail-800">
          <span className="font-semibold tracking-wide text-trail-700">
            {BETA_NOTICE.label}
          </span>
          <span className="text-trail-600">
            {" "}
            · PawPath is currently focused on{" "}
            <span className="font-medium text-trail-700">
              North San Diego County
            </span>
            . More areas coming soon.
          </span>
        </p>
      </div>
    </div>
  );
}
