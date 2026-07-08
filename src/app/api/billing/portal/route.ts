import { NextResponse } from "next/server";
import {
  createBillingPortalSession,
  requireWalkerUser,
} from "@/lib/billing";
import { isStripeConfigured } from "@/lib/stripe";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured yet." },
      { status: 503 }
    );
  }

  try {
    const { profile } = await requireWalkerUser();

    if (!profile.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found" },
        { status: 400 }
      );
    }

    const session = await createBillingPortalSession(profile.stripeCustomerId);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to open billing portal";

    if (message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
