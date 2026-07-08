import { NextResponse } from "next/server";
import { z } from "zod";
import {
  OAUTH_SIGNUP_ROLE_COOKIE,
  OAUTH_TERMS_COOKIE,
  isGoogleAuthConfigured,
} from "@/lib/google-auth";

const bodySchema = z.object({
  role: z.enum(["OWNER", "WALKER"]),
  termsAccepted: z.literal(true),
});

export async function POST(request: Request) {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.json(
      { error: "Google sign-in is not configured yet." },
      { status: 503 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Accept the terms and choose owner or walker before continuing." },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ ok: true });
  const cookieOptions = {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax" as const,
  };

  response.cookies.set(
    OAUTH_SIGNUP_ROLE_COOKIE,
    parsed.data.role,
    cookieOptions
  );
  response.cookies.set(OAUTH_TERMS_COOKIE, "1", cookieOptions);

  return response;
}
