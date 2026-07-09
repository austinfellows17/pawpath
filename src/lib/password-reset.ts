import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { queueNotification } from "@/lib/notifications";

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, passwordHash: true },
  });

  // Always succeed silently to avoid email enumeration.
  if (!user?.passwordHash) {
    return { sent: false };
  }

  const token = randomBytes(RESET_TOKEN_BYTES).toString("hex");
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await db.verificationToken.deleteMany({
    where: { identifier: `password-reset:${normalizedEmail}` },
  });

  await db.verificationToken.create({
    data: {
      identifier: `password-reset:${normalizedEmail}`,
      token,
      expires,
    },
  });

  const resetUrl = appUrl(`/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`);

  queueNotification({
    userId: user.id,
    subject: "Reset your PawPath password",
    emailBody: `We received a request to reset your PawPath password.\n\nReset your password (link expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
    smsBody: "PawPath: Password reset requested. Check your email for the link.",
  });

  return { sent: true };
}

export async function resetPasswordWithToken({
  email,
  token,
  password,
}: {
  email: string;
  token: string;
  password: string;
}) {
  const normalizedEmail = email.toLowerCase().trim();

  const record = await db.verificationToken.findFirst({
    where: {
      identifier: `password-reset:${normalizedEmail}`,
      token,
    },
  });

  if (!record || record.expires < new Date()) {
    throw new Error("This reset link is invalid or has expired");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.$transaction([
    db.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash },
    }),
    db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: record.identifier,
          token: record.token,
        },
      },
    }),
  ]);
}
