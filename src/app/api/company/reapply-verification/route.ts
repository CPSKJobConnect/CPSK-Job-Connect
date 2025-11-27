import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { uploadDocument } from "@/lib/uploadDocument";
import { NextRequest, NextResponse } from "next/server";
import { withResponseCsrfGuard } from '@/lib/csrfGuard';

/**
 * POST /api/company/reapply-verification
 * Allow rejected companies to re-upload evidence and reset status to PENDING
 */
async function POST_impl(request: NextRequest) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const evidenceFile = formData.get("evidence") as File | null;

    if (!evidenceFile) {
      return NextResponse.json({ error: "Evidence file is required" }, { status: 400 });
    }

    // --- sanitize file name (1.1.1) ---
    const safeFileName = encodeURIComponent(evidenceFile.name.replace(/[\s\\/]+/g, "_"));
    const safeEvidenceFile = new File([evidenceFile], safeFileName, { type: evidenceFile.type });

    const company = await prisma.company.findUnique({
      where: { account_id: parseInt(session.user.id) },
      select: {
        id: true,
        name: true,
        registration_status: true,
      }
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (company.registration_status !== "REJECTED") {
      return NextResponse.json({ error: "Only rejected companies can re-apply for verification" }, { status: 403 });
    }

    // Upload the new evidence
    const evidenceDoc = await uploadDocument(safeEvidenceFile, session.user.id, 7);

    // Reset registration status
    await prisma.company.update({
      where: { id: company.id },
      data: {
        registration_status: "PENDING",
        verified_at: null,
        verified_by: null,
        verification_notes: null,
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        account_id: parseInt(session.user.id),
        message: "Your new evidence has been uploaded successfully. Your verification request is now pending admin review."
      }
    });

    // Notify admins
    try {
      const { notifyAdminsCompanyReapplication } = await import("@/lib/notifyAdmins");
      await notifyAdminsCompanyReapplication(company.name, parseInt(session.user.id));
    } catch (error) {
      console.error("Failed to notify admins:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Evidence uploaded successfully. Your verification is now pending admin review.",
      evidence: evidenceDoc
    });

  } catch (error) {
    console.error("Error in company reapply-verification:", error);
    return NextResponse.json({ error: "Failed to process re-verification request" }, { status: 500 });
  }
}

export const POST = withResponseCsrfGuard(POST_impl as any);
