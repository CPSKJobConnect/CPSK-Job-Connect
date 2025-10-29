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
    const docTypeId = parseInt(formData.get("docTypeId") as string);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!docTypeId || docTypeId < 1 || docTypeId > 4) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { id: parseInt(session.user.id) }
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Upload document using the utility function
    const document = await uploadDocument(file, String(account.id), docTypeId);

    return NextResponse.json(document, { status: 201 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
