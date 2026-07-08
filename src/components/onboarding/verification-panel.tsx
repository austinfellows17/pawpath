"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, Upload } from "lucide-react";

type VerificationStatus = {
  verificationStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  verificationSubmittedAt: string | null;
  verificationReviewedAt: string | null;
  verificationNotes: string | null;
  verificationDocFileName: string | null;
} | null;

export function VerificationPanel() {
  const [status, setStatus] = useState<VerificationStatus>(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/verification");
    if (response.ok) {
      const data = await response.json();
      setStatus(data.status);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a file first");
      return;
    }

    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("document", file);

    const response = await fetch("/api/verification", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Failed to submit document");
      setSubmitting(false);
      return;
    }

    setFile(null);
    setSubmitting(false);
    await load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-trail-600" />
      </div>
    );
  }

  const currentStatus = status?.verificationStatus ?? "NONE";

  return (
    <div className="space-y-4">
      {currentStatus === "APPROVED" && (
        <div className="rounded-2xl border border-trail-200 bg-trail-50 p-5">
          <p className="inline-flex items-center gap-2 font-medium text-trail-900">
            <ShieldCheck className="h-4 w-4" />
            Verified
          </p>
          <p className="mt-2 text-sm text-trail-700">
            Your ID was approved. The Verified badge now shows on your profile.
          </p>
        </div>
      )}

      {currentStatus === "PENDING" && (
        <div className="rounded-2xl border border-sand-300 bg-sand-100 p-5">
          <p className="flex items-center gap-2">
            <Badge>Pending review</Badge>
          </p>
          <p className="mt-2 text-sm text-sand-700">
            {status?.verificationDocFileName ?? "Your document"} was submitted
            {status?.verificationSubmittedAt
              ? ` on ${new Date(status.verificationSubmittedAt).toLocaleDateString()}`
              : ""}
            . An admin will review it soon.
          </p>
        </div>
      )}

      {currentStatus === "REJECTED" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-900">Resubmission needed</p>
          {status?.verificationNotes && (
            <p className="mt-2 text-sm text-red-800">
              Reviewer note: {status.verificationNotes}
            </p>
          )}
          <p className="mt-2 text-sm text-red-700">
            Please upload a clearer document below.
          </p>
        </div>
      )}

      {currentStatus !== "APPROVED" && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-dashed border-sand-300 bg-sand-50 p-6"
        >
          <label className="text-sm font-medium text-trail-800">
            Government-issued ID (JPEG, PNG, WebP, or PDF · max 4MB)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-sm text-sand-700 file:mr-4 file:rounded-full file:border-0 file:bg-trail-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-trail-800"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <Button
            type="submit"
            size="sm"
            className="mt-4"
            disabled={submitting || !file}
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {currentStatus === "PENDING" ? "Resubmit" : "Submit for review"}
          </Button>
          <p className="mt-3 text-xs text-sand-500">
            Your document is only visible to PawPath admins for verification
            purposes and is never shown publicly.
          </p>
        </form>
      )}
    </div>
  );
}
