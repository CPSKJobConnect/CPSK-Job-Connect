import { prisma } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminAccount = await prisma.account.findUnique({
      where: { email: session.user.email },
      include: { accountRole: true }
    });

    if (!adminAccount || adminAccount.accountRole?.name?.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const documentId = parseInt(id);

    if (!documentId || isNaN(documentId)) {
      return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
    }

    // Find the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        documentType: true
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Get file from Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(document.file_path, 300); // 5 minutes expiry

    if (error || !data) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
    }

    return NextResponse.json({
      url: data.signedUrl,
      fileName: document.file_name,
      fileType: document.documentType.name
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to get document" }, { status: 500 });
  }
}
