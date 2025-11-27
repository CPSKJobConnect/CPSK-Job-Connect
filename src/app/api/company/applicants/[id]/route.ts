import { getApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/company/applicants/[id]
 *
 * Returns detailed information about an applicant for the logged-in company
 * The ID parameter is the application ID (not student ID)
 *
 * Example: GET /api/company/applicants/15
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { account_id: parseInt(session.user.id) },
      select: { id: true }
    });

    if (!company) {
      return NextResponse.json({ error: "No company found for this account." }, { status: 403 });
    }

    // Canonicalize route param (1.1.1)
    const idParam = decodeURIComponent((await params).id).trim();
    const applicationId = parseInt(idParam, 10);

    if (isNaN(applicationId)) {
      return NextResponse.json({ error: "Invalid application ID." }, { status: 400 });
    }

    // Fetch the application with student details
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        student: { include: { account: { select: { email: true, logoUrl: true } } } },
        jobPost: { select: { id: true, jobName: true, company_id: true } },
        resumeDocument: { select: { id: true, file_path: true, file_name: true } },
        cvDocument: { select: { id: true, file_path: true, file_name: true } },
        portfolioDocument: { select: { id: true, file_path: true, file_name: true } },
        transcriptDocument: { select: { id: true, file_path: true, file_name: true } }
      }
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    if (application.jobPost.company_id !== company.id) {
      return NextResponse.json({ error: "You do not have permission to view this applicant." }, { status: 403 });
    }

    const [firstname, ...lastnameParts] = application.student.name.split(" ");
    const lastname = lastnameParts.join(" ");

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const createSignedUrl = async (filePath?: string) => {
      if (!filePath) return null;
      const { data } = await supabase.storage.from("documents").createSignedUrl(filePath, 3600);
      return data?.signedUrl || null;
    };

    const applicantInfo = {
      applicant_id: application.student.id.toString(),
      profile_url: application.student.account.logoUrl || "/default-avatar.png",
      firstname,
      lastname,
      email: application.student.account.email,
      phone_number: application.student.phone,
      faculty: application.student.faculty,
      year: application.student.year,
      student_id: application.student.student_id,
      documents: {
        resume_id: application.resumeDocument?.id || null,
        resume_url: await createSignedUrl(application.resumeDocument?.file_path),
        resume_name: application.resumeDocument?.file_name || null,
        cv_id: application.cvDocument?.id || null,
        cv_url: await createSignedUrl(application.cvDocument?.file_path),
        cv_name: application.cvDocument?.file_name || null,
        portfolio_id: application.portfolioDocument?.id || null,
        portfolio_url: await createSignedUrl(application.portfolioDocument?.file_path),
        portfolio_name: application.portfolioDocument?.file_name || null,
        transcript_id: application.transcriptDocument?.id || null,
        transcript_url: await createSignedUrl(application.transcriptDocument?.file_path),
        transcript_name: application.transcriptDocument?.file_name || null
      },
      applied_position: application.jobPost.jobName,
      applied_at: application.applied_at,
      work_experience: [],
      certification: []
    };

    return NextResponse.json({ success: true, data: applicantInfo });

  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching applicant info:", error);
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
