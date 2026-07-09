"use client";

import { useState } from "react";
import { SiteImage } from "@/components/visual/site-image";
import { cn } from "@/lib/utils";

export function WalkerPhotoGallery({
  photos,
  name,
}: {
  photos: string[];
  name: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (photos.length <= 1) {
    return null;
  }

  const activePhoto = photos[activeIndex] ?? photos[0];

  return (
    <div className="mb-8">
      <h2 className="font-medium text-trail-900">Photos</h2>
      <div className="mt-4 space-y-3">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-sand-100">
          <SiteImage
            src={activePhoto}
            alt={`${name} photo ${activeIndex + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            priority={activeIndex === 0}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, index) => (
            <button
              key={photo}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition",
                index === activeIndex
                  ? "border-trail-600"
                  : "border-transparent opacity-80 hover:opacity-100"
              )}
            >
              <SiteImage
                src={photo}
                alt={`${name} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
