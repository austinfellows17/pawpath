/**
 * Prints notification provider setup steps.
 *
 * Usage:
 *   npx tsx scripts/notifications-setup.ts
 */

import { config } from "dotenv";
import {
  isEmailConfigured,
  isSmsConfigured,
} from "../src/lib/notifications";

config({ path: ".env" });

console.log("\nPawPath notification setup\n");

console.log("Email (Resend):");
console.log("1. Create an account at https://resend.com");
console.log("2. Add an API key and verified sender domain");
console.log("3. Set in .env:");
console.log('   RESEND_API_KEY="re_..."');
console.log('   EMAIL_FROM="PawPath <hello@usepawpath.io>"');
console.log(
  "   Verify your domain DNS in Resend before sending to beta testers.\n"
);

console.log("SMS (Twilio):");
console.log("1. Create an account at https://twilio.com");
console.log("2. Buy a phone number with SMS capability");
console.log("3. Set in .env:");
console.log('   TWILIO_ACCOUNT_SID="AC..."');
console.log('   TWILIO_AUTH_TOKEN="..."');
console.log('   TWILIO_FROM_NUMBER="+17605550100"\n');

console.log("Users choose email, text, or both at /dashboard/notifications\n");

if (isEmailConfigured()) {
  console.log("Status: email notifications configured.");
} else {
  console.log("Status: email notifications not configured.");
}

if (isSmsConfigured()) {
  console.log("Status: SMS notifications configured.\n");
} else {
  console.log("Status: SMS notifications not configured.\n");
}
