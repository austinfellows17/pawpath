"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Upload } from "lucide-react";

type CredentialStatus = {
  credentialStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  credentialSubmittedAt: string | null;
  credentialReviewedAt: string | null;
  credentialNotes: string | null;
  credentialDocFileName: string | null;
  isPro: boolean;
} | null;

export function CredentialsPanel({
  onStatusChange,
}: {
  onStatusChange?: () => void;
}) {
  const [status, setStatus] = useState<CredentialStatus>(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/credentials");
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

    const response = await fetch("/api/credentials", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Failed to submit credentials");
      setSubmitting(false);
      return;
    }

    setFile(null);
    setSubmitting(false);
    await load();
    onStatusChange?.();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-trail-600" />
      </div>
    );
  }

  const currentStatus = status?.credentialStatus ?? "NONE";

  return (
    <div className="space-y-4">
      <p className="text-sm text-sand-600">
        Optional: upload Pet First Aid certification, liability insurance, or
        bonding documents to earn a Pro badge on your listing.
      </p>

      {status?.isPro && currentStatus === "APPROVED" && (
        <div className="rounded-2xl border border-trail-200 bg-trail-50 p-5">
          <p className="inline-flex items-center gap-2 font-medium text-trail-900">
            <Shield className="h-4 w-4" />
            Pro walker
          </p>
          <p className="mt-2 text-sm text-trail-700">
            Your credentials were approved. The Pro badge shows on your profile.
          </p>
        </div>
      )}

      {currentStatus === "PENDING" && (
        <div className="rounded-2xl border border-sand-300 bg-sand-100 p-5">
          <Badge>Pending review</Badge>
          <p className="mt-2 text-sm text-sand-700">
            {status?.credentialDocFileName ?? "Your document"} is being reviewed.
          </p>
        </div>
      )}

      {currentStatus === "REJECTED" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-900">Resubmission needed</p>
          {status?.credentialNotes && (
            <p className="mt-2 text-sm text-red-800">
              Reviewer note: {status.credentialNotes}
            </p>
          )}
        </div>
      )}

      {currentStatus !== "APPROVED" && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-dashed border-sand-300 bg-sand-50 p-6"
        >
          <label className="text-sm font-medium text-trail-800">
            Insurance or certification (JPEG, PNG, WebP, or PDF · max 4MB)
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
            Submit credentials
          </Button>
        </form>
      )}
    </div>
  );
}
