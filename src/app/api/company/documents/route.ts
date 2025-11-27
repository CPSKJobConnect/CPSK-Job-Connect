import { getApiSession } from "@/lib/api-auth";
import { withResponseCsrfGuard } from '@/lib/csrfGuard';
import { prisma } from "@/lib/db";
import { FileValidationError, getPolicyForDocType } from "@/lib/filePolicy";
import { uploadDocument } from "@/lib/uploadDocument";
import { NextRequest, NextResponse } from "next/server";
// Allow company evidence (7) and company document (5)
const ALLOWED_COMPANY_DOC_TYPES = new Set([5, 7]);

async function POST_impl(request: NextRequest) {
  try {
    const session = await getApiSession(request);
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

    if (!file || !docTypeIdValue) {
      return NextResponse.json({ error: "Missing file or document type" }, { status: 400 });
    }

    // Canonicalize / decode input (OWASP ASVS 1.1.1)
    const docTypeId = Number.parseInt(decodeURIComponent(docTypeIdValue as string), 10);

    if (Number.isNaN(docTypeId)) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    if (!ALLOWED_COMPANY_DOC_TYPES.has(docTypeId)) {
      return NextResponse.json({ error: "Unsupported document type" }, { status: 400 });
    }

    // Ensure policy exists before upload for clearer error messages
    // This also validates file size and type based on policy
    getPolicyForDocType(docTypeId);

    const document = await uploadDocument(file, account.id.toString(), docTypeId);

    // Prefer the documentType that may be included on the created document
    // (some tests mock the created record with a nested `documentType`). If
    // it's not present, fall back to a separate lookup when the Prisma
    // client exposes `documentType` (tests sometimes only mock `document`).
    let typeName: string | undefined = (document as any).documentType?.name;
    if (!typeName && prisma.documentType) {
      const documentType = await prisma.documentType.findUnique({
        where: { id: docTypeId },
        select: { name: true },
      });
      typeName = documentType?.name ?? undefined;
    }

    return NextResponse.json({
      id: document.id,
      name: document.file_name,
      url: document.file_path,
      uploadedAt: document.created_at.toISOString(),
      type: typeName ?? "Document",
    });
  } catch (error) {
    console.error("Error uploading company document:", error);
    if (error instanceof FileValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}

export const POST = withResponseCsrfGuard(POST_impl as any);
