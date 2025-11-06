import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const docId = parseInt(params.id);

    // Get the document to verify ownership and get file path
    const document = await prisma.document.findFirst({
      where: {
        id: docId,
        account_id: account.id,
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete from Supabase storage
    const { error: deleteError } = await supabase.storage
      .from("documents")
      .remove([document.file_path]);

    if (deleteError) {
      console.error("Failed to delete file from storage:", deleteError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: docId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting company document:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
