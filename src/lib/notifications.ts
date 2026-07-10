import { db } from "@/lib/db";
import { appUrl } from "@/lib/app-url";

export type NotificationPreferences = {
  emailEnabled: boolean;
  smsEnabled: boolean;
  phone: string | null;
  emailConfigured: boolean;
  smsConfigured: boolean;
};

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

export function isSmsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_FROM_NUMBER?.trim()
  );
}

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      notificationEmailEnabled: true,
      notificationSmsEnabled: true,
      notificationPhone: true,
      walkerProfile: { select: { phone: true } },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    emailEnabled: user.notificationEmailEnabled,
    smsEnabled: user.notificationSmsEnabled,
    phone: user.notificationPhone ?? user.walkerProfile?.phone ?? null,
    emailConfigured: isEmailConfigured(),
    smsConfigured: isSmsConfigured(),
  };
}

export async function updateNotificationPreferences(
  userId: string,
  input: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    phone?: string | null;
  }
) {
  if (input.smsEnabled && !input.phone?.trim()) {
    throw new Error("Add a mobile number to receive text notifications");
  }

  return db.user.update({
    where: { id: userId },
    data: {
      notificationEmailEnabled: input.emailEnabled,
      notificationSmsEnabled: input.smsEnabled,
      notificationPhone: input.phone?.trim() || null,
    },
    select: {
      notificationEmailEnabled: true,
      notificationSmsEnabled: true,
      notificationPhone: true,
    },
  });
}

function normalizePhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.startsWith("+")) return phone;
  return `+${digits}`;
}

async function sendEmail(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Email notification failed:", error);
    return false;
  }

  return true;
}

/** Always sends — used for verification, password reset, etc. */
export async function sendTransactionalEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  if (!isEmailConfigured()) {
    throw new Error("Email delivery is not configured");
  }

  const sent = await sendEmail(to, subject, text);
  if (!sent) {
    throw new Error("Failed to send email");
  }
}

async function sendSms(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) return false;

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
    "base64"
  );

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: normalizePhoneNumber(to),
        From: from,
        Body: body.slice(0, 320),
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("SMS notification failed:", error);
    return false;
  }

  return true;
}

export async function notifyUser({
  userId,
  subject,
  emailBody,
  smsBody,
}: {
  userId: string;
  subject: string;
  emailBody: string;
  smsBody: string;
}) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      notificationEmailEnabled: true,
      notificationSmsEnabled: true,
      notificationPhone: true,
      walkerProfile: { select: { phone: true } },
    },
  });

  if (!user) return;

  const phone = user.notificationPhone ?? user.walkerProfile?.phone ?? null;

  const tasks: Promise<boolean>[] = [];

  if (user.notificationEmailEnabled && isEmailConfigured()) {
    tasks.push(sendEmail(user.email, subject, emailBody));
  }

  if (user.notificationSmsEnabled && phone && isSmsConfigured()) {
    tasks.push(sendSms(phone, smsBody));
  }

  if (!tasks.length) return;

  await Promise.allSettled(tasks);
}

export function queueNotification(input: Parameters<typeof notifyUser>[0]) {
  void notifyUser(input).catch((error) => {
    console.error("Notification error:", error);
  });
}
