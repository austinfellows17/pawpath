/**
 * Verifies notification provider credentials by sending a test message.
 *
 * Usage:
 *   npx tsx scripts/notifications-verify.ts you@example.com +17605550100
 *
 * Email and phone are optional — only tests providers that are configured.
 */

import { config } from "dotenv";
import {
  isEmailConfigured,
  isSmsConfigured,
} from "../src/lib/notifications";

config({ path: ".env" });

const testEmail = process.argv[2];
const testPhone = process.argv[3];

async function verifyEmail(to: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "PawPath notification test",
      text: "If you received this, Resend email notifications are working.",
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  console.log(`Email test sent to ${to}`);
}

async function verifySms(to: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
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
        To: to,
        From: from!,
        Body: "PawPath test: SMS notifications are working.",
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  console.log(`SMS test sent to ${to}`);
}

async function main() {
  console.log("\nPawPath notification verification\n");

  if (isEmailConfigured()) {
    if (!testEmail) {
      console.log("Email: configured (pass an email address to send a test)");
    } else {
      await verifyEmail(testEmail);
    }
  } else {
    console.log("Email: not configured — add RESEND_API_KEY to .env");
  }

  if (isSmsConfigured()) {
    if (!testPhone) {
      console.log("SMS: configured (pass a phone number to send a test)");
    } else {
      await verifySms(testPhone);
    }
  } else {
    console.log("SMS: not configured — add Twilio credentials to .env");
  }

  console.log("");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
