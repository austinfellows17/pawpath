"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PROFILE_REPORT_REASONS } from "@/lib/profile-reports";
import { Flag } from "lucide-react";

export function ReportWalkerButton({
  walkerProfileId,
  walkerName,
}: {
  walkerProfileId: string;
  walkerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(PROFILE_REPORT_REASONS[0].value);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch(`/api/walkers/${walkerProfileId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason,
        details: details || undefined,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Failed to submit report");
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
  }

  if (success) {
    return (
      <p className="text-sm text-trail-700">
        Thanks — your report was submitted to PawPath admins for review.
      </p>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Flag className="mr-2 h-4 w-4" />
        Report this profile
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-sand-200 bg-sand-50 p-4"
    >
      <p className="text-sm font-medium text-trail-900">
        Report {walkerName}&apos;s profile
      </p>
      <p className="mt-1 text-xs text-sand-600">
        Reports go to PawPath admins only — not to the walker.
      </p>
      <label className="mt-4 block text-xs font-medium text-sand-700">
        Reason
      </label>
      <select
        value={reason}
        onChange={(e) =>
          setReason(e.target.value as (typeof PROFILE_REPORT_REASONS)[number]["value"])
        }
        className="mt-1 w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
      >
        {PROFILE_REPORT_REASONS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <label className="mt-3 block text-xs font-medium text-sand-700">
        Details (optional)
      </label>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
        placeholder="What happened?"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit report"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
