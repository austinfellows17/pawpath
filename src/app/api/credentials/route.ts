import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  ALLOWED_CREDENTIAL_MIME_TYPES,
  MAX_CREDENTIAL_DOC_BYTES,
  getCredentialStatusForUser,
  submitCredentialDocument,
} from "@/lib/credentials";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "WALKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getCredentialStatusForUser(session.user.id);
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
    return NextResponse.json({ error: "Choose a file first" }, { status: 400 });
  }

  if (!ALLOWED_CREDENTIAL_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG, WebP, or PDF file" },
      { status: 400 }
    );
  }

  if (file.size > MAX_CREDENTIAL_DOC_BYTES) {
    return NextResponse.json(
      { error: "Document must be 4MB or smaller" },
      { status: 400 }
    );
  }

  try {
    const data = new Uint8Array(await file.arrayBuffer());
    await submitCredentialDocument({
      userId: session.user.id,
      data,
      mimeType: file.type,
      fileName: file.name,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit credentials";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
