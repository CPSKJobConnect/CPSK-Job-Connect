import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function uploadDocument(file: File, accountId: string, docTypeId: number) {
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name}`;
  const filePath = `company-${accountId}/${fileName}`;

  // Upload to Supabase storage
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  // Save to database
  const document = await prisma.document.create({
    data: {
      account_id: parseInt(accountId),
      doc_type_id: docTypeId,
      file_path: filePath,
      file_name: file.name,
    },
    include: {
      documentType: true,
    },
  });

  return {
    id: document.id,
    name: document.file_name,
    url: document.file_path,
    uploadedAt: document.created_at.toISOString(),
    type: document.documentType.name,
  };
}

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
    const docTypeId = formData.get("docTypeId");

    if (!file || !docTypeId) {
      return NextResponse.json({ error: "Missing file or document type" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
    }

    // Validate file type (PDF only for company documents)
    if (!file.type.includes("pdf")) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    const document = await uploadDocument(file, account.id.toString(), parseInt(docTypeId as string));

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error uploading company document:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
