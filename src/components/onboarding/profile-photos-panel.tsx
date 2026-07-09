"use client";

import { useRef, useState, useEffect } from "react";
import { SiteImage } from "@/components/visual/site-image";
import { Button } from "@/components/ui/button";
import { getPhotoLimitForTier } from "@/lib/constants";
import type { ListingTier } from "@prisma/client";
import { Loader2, Trash2, Upload } from "lucide-react";

export function ProfilePhotosPanel({
  headshotUrl,
  photoUrls,
  listingTier,
  onChange,
}: {
  headshotUrl: string | null;
  photoUrls: string[];
  listingTier: ListingTier;
  onChange?: (photoUrls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState(photoUrls);
  const [uploading, setUploading] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setUrls(photoUrls);
  }, [photoUrls]);

  const limit = getPhotoLimitForTier(listingTier);
  const galleryUrls = headshotUrl
    ? urls.filter((url) => url !== headshotUrl)
    : urls;
  const remaining = Math.max(0, limit - urls.length);
  const canAddMore = Boolean(headshotUrl) && urls.length < limit;

  async function handleUpload(file: File | null) {
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("photo", file);

    const response = await fetch("/api/profile/photos", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Failed to upload photo");
      setUploading(false);
      return;
    }

    const data = await response.json();
    setUrls(data.photoUrls);
    onChange?.(data.photoUrls);
    setUploading(false);
  }

  async function handleDelete(photoUrl: string) {
    setDeletingUrl(photoUrl);
    setError("");

    const response = await fetch("/api/profile/photos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Failed to remove photo");
      setDeletingUrl(null);
      return;
    }

    const data = await response.json();
    setUrls(data.photoUrls);
    onChange?.(data.photoUrls);
    setDeletingUrl(null);
  }

  return (
    <div className="space-y-4 border-t border-sand-200 pt-6">
      <div>
        <h3 className="font-medium text-trail-900">Profile gallery</h3>
        <p className="mt-1 text-sm text-sand-600">
          {listingTier === "BASIC"
            ? "Trailhead includes your headshot only. Upgrade to Summit (6 photos) or Peak (12 photos) to add a gallery."
            : `Your ${listingTier === "STANDARD" ? "Summit" : "Peak"} tier includes up to ${limit} photos. ${remaining} slot${remaining === 1 ? "" : "s"} remaining.`}
        </p>
      </div>

      {galleryUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {galleryUrls.map((url) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-sand-100"
            >
              <SiteImage
                src={url}
                alt="Gallery photo"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 200px"
              />
              <button
                type="button"
                onClick={() => void handleDelete(url)}
                disabled={deletingUrl === url}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Remove photo"
              >
                {deletingUrl === url ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Add gallery photo
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              void handleUpload(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {!headshotUrl && (
        <p className="text-sm text-sand-500">
          Upload your headshot first, then add gallery photos.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
