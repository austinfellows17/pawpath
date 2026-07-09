"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ListingReviewQueueItem } from "@/lib/listing-review";
import { ExternalLink, FileText } from "lucide-react";

export function ListingReviewQueue({
  initialListings,
}: {
  initialListings: ListingReviewQueueItem[];
}) {
  const [listings, setListings] = useState(initialListings);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleReview(id: string, action: "approve" | "reject") {
    setBusyId(id);

    const response = await fetch(`/api/admin/listings/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        notes: action === "reject" ? notes || undefined : undefined,
      }),
    });

    if (response.ok) {
      setListings((prev) => prev.filter((item) => item.id !== id));
      setRejectingId(null);
      setNotes("");
    }

    setBusyId(null);
  }

  if (listings.length === 0) {
    return (
      <p className="mt-4 text-sm text-sand-600">
        No pending walker applications right now.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {listings.map((listing) => (
        <div
          key={listing.id}
          className="rounded-2xl border border-sand-200 bg-white/70 p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            {listing.headshotUrl && (
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-sand-100">
                <Image
                  src={listing.headshotUrl}
                  alt={`${listing.name} headshot`}
                  fill
                  className="object-cover object-[center_20%]"
                  sizes="96px"
                />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-trail-900">{listing.name}</p>
                  <p className="text-sm text-sand-600">{listing.email}</p>
                  <p className="mt-1 text-sm text-trail-700">{listing.headline}</p>
                  <p className="mt-2 text-sm text-sand-600 line-clamp-3">
                    {listing.bio}
                  </p>
                </div>
                <Badge>
                  {listing.isResubmission ? "Re-review" : "New application"}
                </Badge>
              </div>

              {listing.pendingChangesSummary && (
                <p className="mt-2 text-sm font-medium text-amber-800">
                  Changed: {listing.pendingChangesSummary}
                </p>
              )}

              {(listing.clientReferenceName ||
                listing.clientReferenceContact ||
                listing.clientReferenceNotes) && (
                <div className="mt-3 rounded-xl border border-sand-200 bg-sand-50 p-3 text-sm text-sand-700">
                  <p className="font-medium text-trail-900">Client reference</p>
                  {listing.clientReferenceName && (
                    <p className="mt-1">{listing.clientReferenceName}</p>
                  )}
                  {listing.clientReferenceContact && (
                    <p>{listing.clientReferenceContact}</p>
                  )}
                  {listing.clientReferenceNotes && (
                    <p className="mt-1 text-sand-600">
                      {listing.clientReferenceNotes}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-sand-600">
                <span>
                  {listing.city ?? listing.zipCode}
                  {listing.neighborhood ? ` · ${listing.neighborhood}` : ""}
                </span>
                {listing.phone && <span>{listing.phone}</span>}
                {listing.rate30Min && <span>30 min: {listing.rate30Min}</span>}
                {listing.rate60Min && <span>1 hr: {listing.rate60Min}</span>}
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {listing.services.map((service) => (
                  <span
                    key={service}
                    className="rounded-full bg-sand-100 px-2 py-0.5 text-xs text-sand-700"
                  >
                    {service}
                  </span>
                ))}
              </div>

              <p className="mt-2 text-xs text-sand-500">
                Submitted{" "}
                {listing.submittedAt
                  ? new Date(listing.submittedAt).toLocaleDateString()
                  : "recently"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-sand-200 pt-4">
            {listing.hasIdDocument ? (
              <a
                href={`/api/admin/verifications/${listing.id}/document`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-trail-700 hover:underline"
              >
                <FileText className="h-4 w-4" />
                View ID document
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="text-sm text-red-600">No ID document uploaded</span>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleReview(listing.id, "approve")}
                disabled={busyId === listing.id || !listing.hasIdDocument}
              >
                Approve & go live
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setRejectingId(rejectingId === listing.id ? null : listing.id)
                }
                disabled={busyId === listing.id}
              >
                Reject
              </Button>
            </div>
          </div>

          {rejectingId === listing.id && (
            <div className="mt-3 border-t border-sand-200 pt-3">
              <label className="text-xs font-medium text-sand-700">
                Reason (shown to walker, optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
                placeholder="e.g. Headshot is unclear, please upload a new photo"
              />
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReview(listing.id, "reject")}
                  disabled={busyId === listing.id}
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
