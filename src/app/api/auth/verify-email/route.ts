import { NextResponse } from "next/server";
import { z } from "zod";
import {
  resendEmailVerification,
  verifyEmailWithToken,
} from "@/lib/email-verification";
import { enforceRateLimit } from "@/lib/rate-limit";

const verifySchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
});

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "verify-email", 10, 60 * 60 * 1000);
  if (limited) return limited;

  const body = await request.json();
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await verifyEmailWithToken(parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to verify email";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const limited = enforceRateLimit(request, "resend-verify", 5, 60 * 60 * 1000);
  if (limited) return limited;

  const body = await request.json();
  const parsed = resendSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  try {
    await resendEmailVerification(parsed.data.email);
    return NextResponse.json({
      success: true,
      message:
        "We sent a new verification link. Check your inbox and spam folder.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to resend verification";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
