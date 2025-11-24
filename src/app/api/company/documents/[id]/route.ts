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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Canonicalize route param (1.1.1)
    const docId = parseInt(decodeURIComponent(id).trim(), 10);
    if (isNaN(docId)) {
      return NextResponse.json({ error: "Invalid document ID." }, { status: 400 });
    }

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

    const document = await prisma.document.findFirst({
      where: { id: docId, account_id: account.id },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabase.storage
      .from("documents")
      .remove([document.file_path]);

    if (deleteError) {
      console.error("Failed to delete file from storage:", deleteError);
    }

    await prisma.document.delete({ where: { id: docId } });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting company document:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
