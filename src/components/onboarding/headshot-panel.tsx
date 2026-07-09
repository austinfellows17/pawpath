"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Upload } from "lucide-react";

export function HeadshotPanel({
  initialUrl,
  onUploaded,
}: {
  initialUrl?: string | null;
  onUploaded?: (url: string) => void;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [headshotUrl, setHeadshotUrl] = useState(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | null) {
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("photo", file);

    const response = await fetch("/api/profile/headshot", {
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
    setHeadshotUrl(data.headshotUrl);
    onUploaded?.(data.headshotUrl);
    setUploading(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="avatar-ring shrink-0 rounded-3xl">
          <div className="relative h-32 w-32 overflow-hidden rounded-[26px] bg-sand-100">
            {headshotUrl ? (
              <Image
                src={headshotUrl}
                alt="Your headshot"
                fill
                className="object-cover object-[center_20%]"
                sizes="128px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-sand-500">
                No photo yet
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-3 text-center sm:text-left">
          <p className="text-sm text-sand-700">
            Owners see your headshot on your listing. Use a clear, friendly photo
            of yourself — no sunglasses or filters.
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => cameraInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              Take a selfie
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={uploading}
              onClick={() => uploadInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload photo
            </Button>
          </div>
          <p className="text-xs text-sand-500">
            JPEG, PNG, or WebP · max 2MB. On your phone, &ldquo;Take a selfie&rdquo;
            opens your front camera.
          </p>
        </div>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
