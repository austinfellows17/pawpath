import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  isEmailVerificationRequired,
  sendEmailVerification,
} from "@/lib/email-verification";
import { isEmailConfigured } from "@/lib/notifications";
import { enforceRateLimit } from "@/lib/rate-limit";

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["OWNER", "WALKER"]),
});

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "signup", 5, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;
    const verificationRequired = isEmailVerificationRequired();

    if (verificationRequired && !isEmailConfigured()) {
      return NextResponse.json(
        {
          error:
            "Email verification is enabled but email delivery is not configured. Try again later.",
        },
        { status: 503 }
      );
    }

    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        termsAcceptedAt: new Date(),
      },
    });

    if (verificationRequired) {
      try {
        await sendEmailVerification(user.id, user.email);
      } catch {
        await db.user.delete({ where: { id: user.id } });
        return NextResponse.json(
          {
            error:
              "We couldn't send your verification email. Please try again in a few minutes.",
          },
          { status: 503 }
        );
      }

      return NextResponse.json({ success: true, verifyEmail: true });
    }

    return NextResponse.json({ success: true, verifyEmail: false });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
