import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { uploadDocument } from "@/lib/uploadDocument";

export async function POST(request: NextRequest) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const docTypeIdRaw = formData.get("docTypeId") as string;
    const docTypeId = parseInt(docTypeIdRaw?.trim() ?? "", 10); // canonicalize input

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Basic MIME type check
    if (!file.type || !["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Optional: file size check (example 10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    if (!docTypeId || docTypeId < 1 || docTypeId > 4) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { id: parseInt(session.user.id, 10) }
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Upload document using the utility function
    const document = await uploadDocument(file, String(account.id), docTypeId);

    return NextResponse.json(document, { status: 201 });

  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("API error:", error);
    }
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
