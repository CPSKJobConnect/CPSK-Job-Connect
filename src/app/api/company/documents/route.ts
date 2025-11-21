import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { uploadDocument } from "@/lib/uploadDocument";
import { FileValidationError, getPolicyForDocType } from "@/lib/filePolicy";

const ALLOWED_COMPANY_DOC_TYPES = new Set([7]);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.account.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const docTypeIdValue = formData.get("docTypeId");
    const docTypeId = docTypeIdValue ? Number.parseInt(docTypeIdValue as string, 10) : NaN;

    if (!file || Number.isNaN(docTypeId)) {
      return NextResponse.json({ error: "Missing file or document type" }, { status: 400 });
    }

    if (!ALLOWED_COMPANY_DOC_TYPES.has(docTypeId)) {
      return NextResponse.json({ error: "Unsupported document type" }, { status: 400 });
    }

    // Ensure policy exists before upload for clearer error messages
    getPolicyForDocType(docTypeId);

    const document = await uploadDocument(file, account.id.toString(), docTypeId);
    const documentType = await prisma.documentType.findUnique({
      where: { id: docTypeId },
      select: { name: true },
    });

    return NextResponse.json({
      id: document.id,
      name: document.file_name,
      url: document.file_path,
      uploadedAt: document.created_at.toISOString(),
      type: documentType?.name ?? "Document",
    });
  } catch (error) {
    console.error("Error uploading company document:", error);
    if (error instanceof FileValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
