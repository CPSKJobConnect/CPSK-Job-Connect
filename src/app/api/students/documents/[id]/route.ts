import { prisma } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

const logDebug = (...args: any[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(...args)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Canonicalize & validate document ID
    const documentIdRaw = (await params).id;
    const documentId = parseInt(documentIdRaw, 10);

    if (!documentId || isNaN(documentId)) {
      return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
    }

    // Fetch account
    const account = await prisma.account.findUnique({
      where: { id: parseInt(session.user.id, 10) }
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Verify document ownership
    const document = await prisma.document.findFirst({
      where: { id: documentId, account_id: account.id }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete from Supabase storage
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([document.file_path]);

    if (storageError) {
      logDebug("Supabase delete error:", storageError);
      // Continue to delete from DB anyway
    }

    // Delete from database
    await prisma.document.delete({ where: { id: documentId } });

    return NextResponse.json({ message: "Document deleted successfully" });

  } catch (error) {
    logDebug("API error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
