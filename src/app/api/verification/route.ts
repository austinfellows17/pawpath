import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  ALLOWED_VERIFICATION_MIME_TYPES,
  MAX_VERIFICATION_DOC_BYTES,
  getVerificationStatusForUser,
  submitVerificationDocument,
} from "@/lib/verification";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "WALKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getVerificationStatusForUser(session.user.id);
  return NextResponse.json({ status });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "WALKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("document");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No document provided" }, { status: 400 });
  }

  if (!ALLOWED_VERIFICATION_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "File must be a JPEG, PNG, WebP, or PDF" },
      { status: 400 }
    );
  }

  if (file.size > MAX_VERIFICATION_DOC_BYTES) {
    return NextResponse.json(
      { error: "File must be smaller than 4MB" },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  try {
    await submitVerificationDocument({
      userId: session.user.id,
      data: bytes,
      mimeType: file.type,
      fileName: file.name,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit document. Complete your listing first." },
      { status: 400 }
    );
  }
}
