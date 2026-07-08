import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { geocodeZipCode, isInSanDiegoCounty } from "@/lib/geo";

const ownerSchema = z.object({
  zipCode: z.string().regex(/^\d{5}$/),
  dogName: z.string().optional(),
  dogBreed: z.string().optional(),
  dogNotes: z.string().optional(),
});

const walkerSchema = z.object({
  zipCode: z.string().regex(/^\d{5}$/),
  headline: z.string().min(1),
  bio: z.string().min(1),
  rate30Min: z.string().optional(),
  rate60Min: z.string().optional(),
  services: z.array(z.string()).min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
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
      const parsed = walkerSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid listing data" }, { status: 400 });
      }

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
          email: parsed.data.email ?? session.user.email,
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
          email: parsed.data.email ?? session.user.email,
        },
      });
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
