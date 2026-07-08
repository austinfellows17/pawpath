"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { VerificationQueueItem } from "@/lib/verification";
import { FileText, ExternalLink } from "lucide-react";

export function VerificationQueue({
  initialVerifications,
}: {
  initialVerifications: VerificationQueueItem[];
}) {
  const [verifications, setVerifications] = useState(initialVerifications);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleReview(id: string, action: "approve" | "reject") {
    setBusyId(id);

    const response = await fetch(`/api/admin/verifications/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        notes: action === "reject" ? notes || undefined : undefined,
      }),
    });

    if (response.ok) {
      setVerifications((prev) => prev.filter((v) => v.id !== id));
      setRejectingId(null);
      setNotes("");
    }

    setBusyId(null);
  }

  if (verifications.length === 0) {
    return (
      <p className="mt-4 text-sm text-sand-600">
        No pending verifications right now.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {verifications.map((v) => (
        <div
          key={v.id}
          className="rounded-2xl border border-sand-200 bg-white/70 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-trail-900">{v.name}</p>
              <p className="text-sm text-sand-600">{v.email}</p>
              <p className="mt-1 text-sm text-sand-600">
                {v.headline}
                {v.neighborhood ? ` · ${v.neighborhood}` : ""}
              </p>
              <p className="mt-1 text-xs text-sand-500">
                Submitted{" "}
                {v.submittedAt
                  ? new Date(v.submittedAt).toLocaleDateString()
                  : "recently"}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              {v.hasDocument ? (
                <a
                  href={`/api/admin/verifications/${v.id}/document`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-trail-700 hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  View document
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-sm text-sand-500">No document uploaded</span>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleReview(v.id, "approve")}
                  disabled={busyId === v.id}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setRejectingId(rejectingId === v.id ? null : v.id)
                  }
                  disabled={busyId === v.id}
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>

          {rejectingId === v.id && (
            <div className="mt-3 border-t border-sand-200 pt-3">
              <label className="text-xs font-medium text-sand-700">
                Reason (shown to walker, optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
                placeholder="e.g. Document was blurry, please resubmit"
              />
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReview(v.id, "reject")}
                  disabled={busyId === v.id}
                >
                  Confirm rejection
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRejectingId(null);
                    setNotes("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
