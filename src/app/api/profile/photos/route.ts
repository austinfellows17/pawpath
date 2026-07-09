import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  isSupabaseStorageConfigured,
  uploadProfilePhoto,
  deleteProfilePhoto,
} from "@/lib/supabase-storage";
import {
  ALLOWED_PHOTO_MIME_TYPES,
  MAX_PHOTO_BYTES,
  buildPhotoUrls,
  canAddPhoto,
  getGalleryUrls,
  isProfilePhotoUrl,
  resolvePhotoStoragePath,
} from "@/lib/profile-photos";

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
      headshotUrl: true,
      photoUrls: true,
      listingTier: true,
    },
  });

  if (!profile?.headshotUrl) {
    return NextResponse.json(
      { error: "Upload your headshot before adding gallery photos" },
      { status: 400 }
    );
  }

  if (
    !canAddPhoto({
      tier: profile.listingTier,
      currentCount: profile.photoUrls.length,
    })
  ) {
    return NextResponse.json(
      {
        error:
          profile.listingTier === "BASIC"
            ? "Upgrade to Summit or Peak to add more profile photos"
            : "You've reached the photo limit for your tier",
      },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("photo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a photo first" }, { status: 400 });
  }

  if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_MIME_TYPES)[number])) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG, or WebP image" },
      { status: 400 }
    );
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json(
      { error: "Photo must be 2MB or smaller" },
      { status: 400 }
    );
  }

  try {
    const data = new Uint8Array(await file.arrayBuffer());
    const { publicUrl } = await uploadProfilePhoto({
      userId: session.user.id,
      data,
      mimeType: file.type,
      fileName: file.name,
    });

    const galleryUrls = [...getGalleryUrls(profile.photoUrls, profile.headshotUrl), publicUrl];

    await db.walkerProfile.update({
      where: { userId: session.user.id },
      data: {
        photoUrls: buildPhotoUrls(profile.headshotUrl, galleryUrls),
      },
    });

    return NextResponse.json({ photoUrl: publicUrl, photoUrls: buildPhotoUrls(profile.headshotUrl, galleryUrls) });
  } catch {
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}

const deleteSchema = z.object({
  photoUrl: z.string().url(),
});

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "WALKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const profile = await db.walkerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      headshotUrl: true,
      headshotStoragePath: true,
      photoUrls: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { photoUrl } = parsed.data;

  if (photoUrl === profile.headshotUrl) {
    return NextResponse.json(
      { error: "Use the headshot upload to replace your main photo" },
      { status: 400 }
    );
  }

  if (!profile.photoUrls.includes(photoUrl)) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const galleryUrls = getGalleryUrls(profile.photoUrls, profile.headshotUrl).filter(
    (url) => url !== photoUrl
  );

  await db.walkerProfile.update({
    where: { userId: session.user.id },
    data: {
      photoUrls: buildPhotoUrls(profile.headshotUrl, galleryUrls),
    },
  });

  if (isProfilePhotoUrl(photoUrl)) {
    const storagePath = resolvePhotoStoragePath(photoUrl);
    if (storagePath && storagePath !== profile.headshotStoragePath) {
      void deleteProfilePhoto(storagePath).catch(() => undefined);
    }
  }

  return NextResponse.json({
    photoUrls: buildPhotoUrls(profile.headshotUrl, galleryUrls),
  });
}
