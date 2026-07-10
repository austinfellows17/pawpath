import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { geocodeZipCode, isInSanDiegoCounty } from "@/lib/geo";
import { walkerListingSchema } from "@/lib/walker-application";
import { triggerListingReReview } from "@/lib/listing-review";
import { ListingReviewStatus } from "@prisma/client";

const ownerSchema = z.object({
  zipCode: z.string().regex(/^\d{5}$/),
  dogName: z.string().optional(),
  dogBreed: z.string().optional(),
  dogNotes: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const geocoded = await geocodeZipCode(body.zipCode);

  if (!geocoded) {
    return NextResponse.json({ error: "Invalid zip code" }, { status: 400 });
  }

  if (!isInSanDiegoCounty(body.zipCode)) {
    return NextResponse.json(
      { error: "PawPath is currently limited to San Diego County" },
      { status: 400 }
    );
  }

  try {
    if (session.user.role === "OWNER") {
      const parsed = ownerSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
      }

      await db.ownerProfile.upsert({
        where: { userId: session.user.id },
        update: {
          zipCode: parsed.data.zipCode,
          city: geocoded.city,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
          dogName: parsed.data.dogName,
          dogBreed: parsed.data.dogBreed,
          dogNotes: parsed.data.dogNotes,
        },
        create: {
          userId: session.user.id,
          zipCode: parsed.data.zipCode,
          city: geocoded.city,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
          dogName: parsed.data.dogName,
          dogBreed: parsed.data.dogBreed,
          dogNotes: parsed.data.dogNotes,
        },
      });
    } else if (session.user.role === "WALKER") {
      const existing = await db.walkerProfile.findUnique({
        where: { userId: session.user.id },
      });

      const parsed = walkerListingSchema.safeParse(body);
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Invalid listing data";
        return NextResponse.json({ error: message }, { status: 400 });
      }

      const bioChanged =
        existing?.listingReviewStatus === ListingReviewStatus.APPROVED &&
        existing.isActive &&
        existing.lastApprovedBio &&
        parsed.data.bio !== existing.lastApprovedBio;

      await db.walkerProfile.upsert({
        where: { userId: session.user.id },
        update: {
          headline: parsed.data.headline,
          bio: parsed.data.bio,
          services: parsed.data.services,
          rate30Min: parsed.data.rate30Min,
          rate60Min: parsed.data.rate60Min,
          zipCode: parsed.data.zipCode,
          city: geocoded.city,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
          phone: parsed.data.phone,
          serviceRadiusMiles: parsed.data.serviceRadiusMiles,
          email: session.user.email,
          clientReferenceName: parsed.data.clientReferenceName || null,
          clientReferenceContact: parsed.data.clientReferenceContact || null,
          clientReferenceNotes: parsed.data.clientReferenceNotes || null,
        },
        create: {
          userId: session.user.id,
          headline: parsed.data.headline,
          bio: parsed.data.bio,
          services: parsed.data.services,
          rate30Min: parsed.data.rate30Min,
          rate60Min: parsed.data.rate60Min,
          zipCode: parsed.data.zipCode,
          city: geocoded.city,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
          phone: parsed.data.phone,
          serviceRadiusMiles: parsed.data.serviceRadiusMiles,
          email: session.user.email,
          clientReferenceName: parsed.data.clientReferenceName || null,
          clientReferenceContact: parsed.data.clientReferenceContact || null,
          clientReferenceNotes: parsed.data.clientReferenceNotes || null,
          isActive: false,
        },
      });

      if (bioChanged) {
        await triggerListingReReview({
          userId: session.user.id,
          changes: ["bio"],
        });
      }
    } else {
      return NextResponse.json({ error: "Invalid role for profile" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "OWNER") {
    const profile = await db.ownerProfile.findUnique({
      where: { userId: session.user.id },
    });
    return NextResponse.json({ profile });
  }

  if (session.user.role === "WALKER") {
    const profile = await db.walkerProfile.findUnique({
      where: { userId: session.user.id },
    });
    return NextResponse.json({ profile });
  }

  return NextResponse.json({ profile: null });
}
