"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminAnalytics } from "@/lib/admin-analytics";
import { BACKGROUND_CHECK_ADDON } from "@/lib/constants";
import { Loader2, RefreshCw } from "lucide-react";

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent
          ? "border-trail-300 bg-trail-50"
          : "border-sand-200 bg-white/80"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-sand-500">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold text-trail-950">
        {value}
      </p>
      {sub && <p className="mt-1 text-sm text-sand-600">{sub}</p>}
    </div>
  );
}

function formatMrr(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}/mo`;
}

function formatRevenue(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function AdminMetricsDashboard() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    const response = await fetch("/api/admin/analytics");
    if (response.ok) {
      setData(await response.json());
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(true), 30_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-trail-600" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-red-600">Failed to load analytics.</p>;
  }

  const maxTrend = Math.max(...data.signupTrend.map((d) => d.total), 1);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-sand-600">
          Updated {new Date(data.generatedAt).toLocaleTimeString()}
          {data.checkrConfigured ? " · Checkr connected" : " · Checkr manual mode"}
        </p>
        <button
          type="button"
          onClick={() => void load(true)}
          className="inline-flex items-center gap-2 rounded-full bg-sand-100 px-3 py-1.5 text-sm font-medium text-sand-700 hover:bg-sand-200"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total users" value={data.users.total} sub={`${data.users.admins} admins`} />
        <MetricCard
          label="Sign-ups today"
          value={data.users.signupsToday}
          sub={`${data.users.signupsLast7Days} last 7 days`}
          accent
        />
        <MetricCard
          label="Owners"
          value={data.users.owners}
          sub={`+${data.users.ownerSignupsLast30Days} last 30d`}
        />
        <MetricCard
          label="Walkers"
          value={data.users.walkers}
          sub={`+${data.users.walkerSignupsLast30Days} last 30d`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Live walkers" value={data.walkers.live} accent />
        <MetricCard
          label="Pending review"
          value={data.walkers.pendingReview}
          sub={`${data.walkers.rejected} rejected`}
        />
        <MetricCard
          label="Est. MRR"
          value={formatMrr(data.revenue.estimatedMrrCents)}
          sub={`${data.revenue.activePaidSubscriptions} paid subs`}
        />
        <MetricCard
          label="BG verified (paid)"
          value={data.walkers.backgroundCheckedPaid}
          sub={`${data.moderation.pendingBackgroundChecks} pending checks`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="BG add-on sales"
          value={data.revenue.backgroundCheckAddonPurchases}
          sub={`${formatRevenue(data.revenue.backgroundCheckAddonRevenueCents)} total revenue`}
          accent
        />
        <MetricCard
          label="BG add-ons (30d)"
          value={data.revenue.backgroundCheckAddonsLast30Days}
          sub={`${data.revenue.backgroundCheckAddonsLast7Days} last 7 days`}
        />
        <MetricCard
          label="BG add-on conversion"
          value={`${data.revenue.backgroundCheckAddonConversionRate}%`}
          sub="Of active paid tier walkers"
        />
        <MetricCard
          label="BG revenue (30d)"
          value={formatRevenue(
            data.revenue.backgroundCheckAddonsLast30Days *
              BACKGROUND_CHECK_ADDON.priceCents
          )}
          sub={`@ ${BACKGROUND_CHECK_ADDON.priceLabel} per add-on`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-sand-200 bg-white/80 p-5">
          <h2 className="font-display text-lg font-semibold text-trail-950">
            Walker tiers
          </h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Trailhead (free)</span>
              <span className="font-medium">{data.walkers.byTier.BASIC}</span>
            </div>
            <div className="flex justify-between">
              <span>Summit ($19)</span>
              <span className="font-medium">{data.walkers.byTier.STANDARD}</span>
            </div>
            <div className="flex justify-between">
              <span>Peak ($39)</span>
              <span className="font-medium">{data.walkers.byTier.FEATURED}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-sand-200 bg-white/80 p-5">
          <h2 className="font-display text-lg font-semibold text-trail-950">
            Moderation load
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <p>Applications: <strong>{data.moderation.pendingListings}</strong></p>
            <p>Reports: <strong>{data.moderation.pendingReports}</strong></p>
            <p>Pro docs: <strong>{data.moderation.pendingCredentials}</strong></p>
            <p>ID checks: <strong>{data.moderation.pendingVerifications}</strong></p>
            <p>Reviews: <strong>{data.moderation.pendingReviews}</strong></p>
            <p>BG checks: <strong>{data.moderation.pendingBackgroundChecks}</strong></p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-sand-200 bg-white/80 p-5">
        <h2 className="font-display text-lg font-semibold text-trail-950">
          Sign-ups — last 30 days
        </h2>
        <div className="mt-4 flex items-end gap-1 h-32">
          {data.signupTrend.map((day) => (
            <div
              key={day.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
              title={`${day.date}: ${day.total} (${day.owners} owners, ${day.walkers} walkers)`}
            >
              <div
                className="w-full rounded-t bg-trail-600/80 transition group-hover:bg-trail-700"
                style={{ height: `${Math.max(4, (day.total / maxTrend) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-sand-500">
          <span>{data.signupTrend[0]?.date}</span>
          <span>{data.signupTrend[data.signupTrend.length - 1]?.date}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-sand-200 bg-white/80 p-5">
        <h2 className="font-display text-lg font-semibold text-trail-950">
          Recent sign-ups
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-sand-200 text-sand-500">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 pr-4 font-medium">Role</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSignups.map((user) => (
                <tr key={user.id} className="border-b border-sand-100">
                  <td className="py-2.5 pr-4 font-medium text-trail-900">
                    {user.name ?? "—"}
                  </td>
                  <td className="py-2.5 pr-4 text-sand-600">{user.email}</td>
                  <td className="py-2.5 pr-4 capitalize">{user.role.toLowerCase()}</td>
                  <td className="py-2.5 pr-4 text-sand-600">
                    {user.role === "WALKER"
                      ? `${user.walkerStatus ?? "—"}${user.listingTier ? ` · ${user.listingTier}` : ""}${user.isBackgroundChecked ? " · BG✓" : ""}`
                      : "—"}
                  </td>
                  <td className="py-2.5 text-sand-600">
                    {new Date(user.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
