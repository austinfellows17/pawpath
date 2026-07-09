"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BackgroundCheckQueueItem } from "@/lib/background-check";

export function BackgroundCheckQueue({
  initialItems,
}: {
  initialItems: BackgroundCheckQueueItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function markClear(id: string) {
    setBusyId(id);
    const response = await fetch(`/api/admin/background-checks/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear" }),
    });
    if (response.ok) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
    setBusyId(null);
  }

  if (items.length === 0) {
    return (
      <p className="mt-4 text-sm text-sand-600">
        No pending background checks. Walkers appear here after purchasing the $50 background check add-on.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl border border-sand-200 bg-white/70 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-trail-900">{item.name}</p>
              <p className="text-sm text-sand-600">{item.email}</p>
              <p className="mt-1 text-sm text-trail-700">{item.headline}</p>
              <p className="mt-1 text-xs text-sand-500">
                {item.listingTier} tier
                {item.invitedAt &&
                  ` · invited ${new Date(item.invitedAt).toLocaleDateString()}`}
              </p>
            </div>
            <Badge>{item.backgroundCheckStatus}</Badge>
          </div>
          {!item.checkrConfigured && (
            <p className="mt-3 text-sm text-amber-800">
              Checkr not configured — use manual clear after running an external check.
            </p>
          )}
          <div className="mt-3">
            <Button
              size="sm"
              onClick={() => markClear(item.id)}
              disabled={busyId === item.id}
            >
              Mark BG Verified
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
