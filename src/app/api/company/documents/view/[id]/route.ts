import { prisma } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.account.findUnique({
      where: { email: session.user.email },
      include: {
        accountRole: true,
        company: { select: { id: true } }
      }
    });

    if (!account || account.accountRole?.name?.toLowerCase() !== "company" || !account.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    // Canonicalize route param (1.1.1)
    const documentId = parseInt(decodeURIComponent(id).trim(), 10);
    if (isNaN(documentId) || documentId <= 0) {
      return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        documentType: true,
        account: {
          include: {
            student: {
              include: {
                applications: {
                  where: {
                    jobPost: { company_id: account.company.id }
                  },
                  select: { id: true }
                }
              }
            }
          }
        }
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const isOwnDocument = document.account_id === account.id;
    const isApplicantDocument = document.account.student &&
      document.account.student.applications.length > 0;

    if (!isOwnDocument && !isApplicantDocument) {
      return NextResponse.json({ error: "Forbidden - No access to this document" }, { status: 403 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(document.file_path, 3600);

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
