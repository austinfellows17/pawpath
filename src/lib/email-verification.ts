import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { sendTransactionalEmail } from "@/lib/notifications";

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function isEmailVerificationRequired() {
  return process.env.REQUIRE_EMAIL_VERIFICATION?.trim() === "true";
}

export async function sendEmailVerification(userId: string, email: string) {
  const token = randomBytes(TOKEN_BYTES).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);
  const normalizedEmail = email.toLowerCase();

  await db.verificationToken.deleteMany({
    where: { identifier: `email-verify:${normalizedEmail}` },
  });

  await db.verificationToken.create({
    data: {
      identifier: `email-verify:${normalizedEmail}`,
      token,
      expires,
    },
  });

  const verifyUrl = appUrl(
    `/verify-email?token=${token}&email=${encodeURIComponent(normalizedEmail)}`
  );

  await sendTransactionalEmail({
    to: normalizedEmail,
    subject: "Verify your PawPath email",
    text: `Welcome to PawPath!\n\nVerify your email to finish setting up your account:\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create a PawPath account, you can ignore this email.`,
  });
}

export async function verifyEmailWithToken({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const normalizedEmail = email.toLowerCase();

  const record = await db.verificationToken.findFirst({
    where: {
      identifier: `email-verify:${normalizedEmail}`,
      token,
    },
  });

  if (!record || record.expires < new Date()) {
    throw new Error("This verification link is invalid or has expired");
  }

  await db.$transaction([
    db.user.update({
      where: { email: normalizedEmail },
      data: { emailVerified: new Date() },
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

export async function resendEmailVerification(email: string) {
  const normalizedEmail = email.toLowerCase();
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, emailVerified: true, passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { sent: false };
  }

  if (user.emailVerified) {
    throw new Error("Email is already verified");
  }

  await sendEmailVerification(user.id, normalizedEmail);
  return { sent: true };
}
