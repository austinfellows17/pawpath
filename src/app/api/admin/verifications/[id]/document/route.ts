import { NextResponse } from "next/server";
import { getVerificationDocument, requireAdmin } from "@/lib/verification";

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

  try {
    const doc = await getVerificationDocument(id);

    if (!doc) {
      return NextResponse.json({ error: "No document found" }, { status: 404 });
    }

    return new NextResponse(doc.data, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${doc.fileName ?? "document"}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load verification document" },
      { status: 500 }
    );
  }
}
