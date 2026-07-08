import { NextResponse } from "next/server";
import { z } from "zod";
import { searchWalkers } from "@/lib/walkers";
import { LAUNCH_REGION } from "@/lib/constants";

const querySchema = z.object({
  zip: z.string().regex(/^\d{5}$/).optional(),
  radius: z.coerce
    .number()
    .min(1)
    .max(LAUNCH_REGION.maxRadiusMiles)
    .optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    zip: searchParams.get("zip") ?? undefined,
    radius: searchParams.get("radius") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid search parameters" }, { status: 400 });
  }

  const zipCode = parsed.data.zip ?? LAUNCH_REGION.defaultZipCode;
  const radiusMiles = parsed.data.radius ?? LAUNCH_REGION.defaultRadiusMiles;

  const result = await searchWalkers({ zipCode, radiusMiles });
  return NextResponse.json(result);
}
