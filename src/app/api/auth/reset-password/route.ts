import { NextResponse } from "next/server";
import { z } from "zod";
import { resetPasswordWithToken } from "@/lib/password-reset";
import { enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "reset-password", 10, 60 * 60 * 1000);
  if (limited) return limited;

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await resetPasswordWithToken(parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reset password";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
