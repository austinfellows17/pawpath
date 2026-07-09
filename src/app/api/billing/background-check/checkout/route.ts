import { NextResponse } from "next/server";
import {
  createBackgroundCheckCheckoutSession,
  requireWalkerUser,
} from "@/lib/billing";
import { isStripeConfigured } from "@/lib/stripe";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured yet. Contact support." },
      { status: 503 }
    );
  }

  try {
    const { user, profile } = await requireWalkerUser();

    const session = await createBackgroundCheckCheckoutSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      walkerProfileId: profile.id,
      existingCustomerId: profile.stripeCustomerId,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start checkout";

    if (message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (
      message === "Walker profile required" ||
      message === "Background check add-on requires Summit or Peak tier" ||
      message === "Background check add-on already purchased"
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
