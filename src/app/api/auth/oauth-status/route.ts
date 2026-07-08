import { NextResponse } from "next/server";
import { isGoogleAuthConfigured } from "@/lib/google-auth";

export async function GET() {
  return NextResponse.json({ google: isGoogleAuthConfigured() });
}
