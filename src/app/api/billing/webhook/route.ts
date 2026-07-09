import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import {
  applySubscriptionToWalker,
  downgradeWalkerToBasic,
  fulfillBackgroundCheckPurchase,
} from "@/lib/billing";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (
          session.mode === "payment" &&
          session.metadata?.checkoutType === "background_check"
        ) {
          const walkerProfileId = session.metadata.walkerProfileId;
          if (walkerProfileId && session.payment_status === "paid") {
            await fulfillBackgroundCheckPurchase({
              walkerProfileId,
              stripeSessionId: session.id,
            });
          }
          break;
        }

        if (session.mode !== "subscription" || !session.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(
          String(session.subscription)
        );

        const walkerProfileId =
          session.metadata?.walkerProfileId ??
          subscription.metadata?.walkerProfileId;

        if (walkerProfileId) {
          await applySubscriptionToWalker({ walkerProfileId, subscription });

          if (
            session.metadata?.includeBackgroundCheck === "true" &&
            session.payment_status === "paid"
          ) {
            await fulfillBackgroundCheckPurchase({
              walkerProfileId,
              stripeSessionId: session.id,
            });
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const walkerProfileId = subscription.metadata?.walkerProfileId;

        if (walkerProfileId) {
          await applySubscriptionToWalker({ walkerProfileId, subscription });
        } else {
          const profile = await db.walkerProfile.findFirst({
            where: { stripeSubscriptionId: subscription.id },
          });
          if (profile) {
            await applySubscriptionToWalker({
              walkerProfileId: profile.id,
              subscription,
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const walkerProfileId = subscription.metadata?.walkerProfileId;

        if (walkerProfileId) {
          await downgradeWalkerToBasic(walkerProfileId);
        } else {
          const profile = await db.walkerProfile.findFirst({
            where: { stripeSubscriptionId: subscription.id },
          });
          if (profile) {
            await downgradeWalkerToBasic(profile.id);
          }
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
