"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CredentialQueueItem } from "@/lib/credentials";
import { ExternalLink, FileText } from "lucide-react";

export function CredentialsQueue({
  initialCredentials,
}: {
  initialCredentials: CredentialQueueItem[];
}) {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleReview(id: string, action: "approve" | "reject") {
    setBusyId(id);

    const response = await fetch(`/api/admin/credentials/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        notes: action === "reject" ? notes || undefined : undefined,
      }),
    });

    if (response.ok) {
      setCredentials((prev) => prev.filter((item) => item.id !== id));
      setRejectingId(null);
      setNotes("");
    }

    setBusyId(null);
  }

  if (credentials.length === 0) {
    return (
      <p className="mt-4 text-sm text-sand-600">
        No pending Pro credential reviews right now.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {credentials.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl border border-sand-200 bg-white/70 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-trail-900">{item.name}</p>
              <p className="text-sm text-sand-600">{item.email}</p>
              <p className="mt-1 text-sm text-sand-600">{item.headline}</p>
            </div>
            <a
              href={`/api/admin/credentials/${item.id}/document`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-trail-700 hover:underline"
            >
              <FileText className="h-4 w-4" />
              View document
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={() => handleReview(item.id, "approve")}
              disabled={busyId === item.id || !item.hasDocument}
            >
              Approve Pro badge
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setRejectingId(rejectingId === item.id ? null : item.id)
              }
              disabled={busyId === item.id}
            >
              Reject
            </Button>
          </div>
          {rejectingId === item.id && (
            <div className="mt-3 border-t border-sand-200 pt-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm"
                placeholder="Reason for rejection (optional)"
              />
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => handleReview(item.id, "reject")}
                disabled={busyId === item.id}
              >
                Confirm rejection
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
