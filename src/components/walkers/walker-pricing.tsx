import { EXTENDED_WALK_PRICING_NOTE } from "@/lib/constants";

type WalkerPricingProps = {
  rate30Min: string | null;
  rate60Min: string | null;
  compact?: boolean;
};

export function WalkerPricing({
  rate30Min,
  rate60Min,
  compact = false,
}: WalkerPricingProps) {
  if (!rate30Min && !rate60Min) return null;

  if (compact) {
    const fromRate = rate30Min ?? rate60Min;
    return (
      <p className="text-sm text-sand-600">
        From{" "}
        <span className="font-medium text-trail-800">
          {fromRate}
          {rate30Min ? "/30 min" : "/hour"}
        </span>
        <span className="text-sand-500"> · info only</span>
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {rate30Min && (
          <div className="rounded-xl border border-sand-200 bg-sand-50/80 p-4">
            <p className="text-sm text-sand-600">30-minute walk</p>
            <p className="mt-1 text-lg font-semibold text-trail-900">
              {rate30Min}
            </p>
          </div>
        )}
        {rate60Min && (
          <div className="rounded-xl border border-sand-200 bg-sand-50/80 p-4">
            <p className="text-sm text-sand-600">1-hour walk</p>
            <p className="mt-1 text-lg font-semibold text-trail-900">
              {rate60Min}
            </p>
          </div>
        )}
      </div>
      <div className="rounded-xl border border-dashed border-sand-300 bg-white/60 p-4">
        <p className="text-sm font-medium text-trail-800">Extended walks</p>
        <p className="mt-1 text-sm text-sand-600">
          {EXTENDED_WALK_PRICING_NOTE}
        </p>
      </div>
      <p className="text-sm text-sand-600">
        Rates are informational only. Final pricing is agreed directly with
        your walker offline.
      </p>
    </div>
  );
}
