import { prisma } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = parseInt((await params).id);

    if (!documentId || isNaN(documentId)) {
      return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
    }

    // Get student account
    const account = await prisma.account.findUnique({
      where: { email: session.user.email }
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Find the document and verify ownership
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        account_id: account.id
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete from Supabase storage
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([document.file_path]);

    if (storageError) {
      console.error("Supabase delete error:", storageError);
      // Continue with database deletion even if storage delete fails
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId }
    });

    return NextResponse.json({ message: "Document deleted successfully" });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
