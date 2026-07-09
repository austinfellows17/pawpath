import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  isSupabaseStorageConfigured,
  uploadProfilePhoto,
  deleteProfilePhoto,
} from "@/lib/supabase-storage";
import { triggerListingReReview } from "@/lib/listing-review";
import { ListingReviewStatus } from "@prisma/client";

const MAX_HEADSHOT_BYTES = 2 * 1024 * 1024;
const ALLOWED_HEADSHOT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "WALKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseStorageConfigured()) {
    return NextResponse.json(
      { error: "Photo storage is not configured" },
      { status: 503 }
    );
  }

  const profile = await db.walkerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      headshotStoragePath: true,
      lastApprovedHeadshotUrl: true,
      listingReviewStatus: true,
      isActive: true,
    },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Save your listing details before uploading a headshot" },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("photo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a photo first" }, { status: 400 });
  }

  if (!ALLOWED_HEADSHOT_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG, or WebP image" },
      { status: 400 }
    );
  }

  if (file.size > MAX_HEADSHOT_BYTES) {
    return NextResponse.json(
      { error: "Photo must be 2MB or smaller" },
      { status: 400 }
    );
  }

  try {
    const data = new Uint8Array(await file.arrayBuffer());
    const { storagePath, publicUrl } = await uploadProfilePhoto({
      userId: session.user.id,
      data,
      mimeType: file.type,
      fileName: file.name,
    });

    await db.walkerProfile.update({
      where: { userId: session.user.id },
      data: {
        headshotUrl: publicUrl,
        headshotStoragePath: storagePath,
        photoUrls: [publicUrl],
      },
    });

    if (
      profile.headshotStoragePath &&
      profile.headshotStoragePath !== storagePath
    ) {
      void deleteProfilePhoto(profile.headshotStoragePath).catch(() => undefined);
    }

    const headshotChanged =
      profile.listingReviewStatus === ListingReviewStatus.APPROVED &&
      profile.isActive &&
      profile.lastApprovedHeadshotUrl &&
      publicUrl !== profile.lastApprovedHeadshotUrl;

    if (headshotChanged) {
      await triggerListingReReview({
        userId: session.user.id,
        changes: ["headshot"],
      });
    }

    return NextResponse.json({ headshotUrl: publicUrl });
  } catch {
    return NextResponse.json(
      { error: "Failed to upload headshot" },
      { status: 500 }
    );
  }
}
