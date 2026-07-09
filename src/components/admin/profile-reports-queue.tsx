"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PROFILE_REPORT_REASONS, type ProfileReportQueueItem } from "@/lib/profile-reports";

export function ProfileReportsQueue({
  initialReports,
}: {
  initialReports: ProfileReportQueueItem[];
}) {
  const [reports, setReports] = useState(initialReports);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [deactivate, setDeactivate] = useState<Record<string, boolean>>({});

  async function handleReview(
    id: string,
    action: "reviewed" | "dismissed"
  ) {
    setBusyId(id);

    const response = await fetch(`/api/admin/reports/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        notes: notes[id] || undefined,
        deactivateWalker: action === "reviewed" ? deactivate[id] : false,
      }),
    });

    if (response.ok) {
      setReports((prev) => prev.filter((item) => item.id !== id));
    }

    setBusyId(null);
  }

  if (reports.length === 0) {
    return (
      <p className="mt-4 text-sm text-sand-600">No pending profile reports.</p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {reports.map((report) => {
        const reasonLabel =
          PROFILE_REPORT_REASONS.find((item) => item.value === report.reason)
            ?.label ?? report.reason;

        return (
          <div
            key={report.id}
            className="rounded-2xl border border-sand-200 bg-white/70 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-trail-900">
                  Report on {report.walkerName}
                </p>
                <p className="text-sm text-sand-600">
                  By {report.reporterName} ({report.reporterEmail})
                </p>
                <p className="mt-2 text-sm font-medium text-trail-800">
                  {reasonLabel}
                </p>
                {report.details && (
                  <p className="mt-1 text-sm text-sand-700">{report.details}</p>
                )}
                <p className="mt-2 text-xs text-sand-500">
                  {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>
              <Link
                href={`/walkers/${report.walkerProfileId}`}
                className="text-sm font-medium text-trail-700 hover:underline"
              >
                View profile
              </Link>
            </div>

            <textarea
              value={notes[report.id] ?? ""}
              onChange={(e) =>
                setNotes((prev) => ({ ...prev, [report.id]: e.target.value }))
              }
              rows={2}
              placeholder="Admin notes (optional)"
              className="mt-3 w-full rounded-lg border border-sand-300 px-3 py-2 text-sm"
            />

            <label className="mt-2 flex items-center gap-2 text-sm text-sand-700">
              <input
                type="checkbox"
                checked={deactivate[report.id] ?? false}
                onChange={(e) =>
                  setDeactivate((prev) => ({
                    ...prev,
                    [report.id]: e.target.checked,
                  }))
                }
              />
              Deactivate walker listing when marking reviewed
            </label>

            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() => handleReview(report.id, "reviewed")}
                disabled={busyId === report.id}
              >
                Mark reviewed
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReview(report.id, "dismissed")}
                disabled={busyId === report.id}
              >
                Dismiss
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
