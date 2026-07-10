import { NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/password-reset";
import { enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "forgot-password", 5, 60 * 60 * 1000);
  if (limited) return limited;

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  await requestPasswordReset(parsed.data.email);

  return NextResponse.json({
    success: true,
    message:
      "If an account exists with that email, we sent password reset instructions.",
  });
}
