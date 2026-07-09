import { NextResponse } from "next/server";
import { requireAdmin, getCredentialDocument } from "@/lib/credentials";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const doc = await getCredentialDocument(id);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return new NextResponse(doc.data, {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `inline; filename="${doc.fileName ?? "credential"}"`,
    },
  });
}
