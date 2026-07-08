import { NextResponse } from "next/server";
import { z } from "zod";
import { PAID_LISTING_TIERS } from "@/lib/constants";
import {
  createTierCheckoutSession,
  requireWalkerUser,
} from "@/lib/billing";
import { isStripeConfigured } from "@/lib/stripe";

const checkoutSchema = z.object({
  tier: z.enum(PAID_LISTING_TIERS),
});

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured yet. Contact support." },
      { status: 503 }
    );
  }

  try {
    const { user, profile } = await requireWalkerUser();
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const session = await createTierCheckoutSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      walkerProfileId: profile.id,
      tier: parsed.data.tier,
      existingCustomerId: profile.stripeCustomerId,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start checkout";

    if (message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message === "Walker profile required") {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
