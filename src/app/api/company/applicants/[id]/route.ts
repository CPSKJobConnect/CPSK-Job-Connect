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
      return NextResponse.json(
        { error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { account_id: parseInt(session.user.id) },
      select: { id: true }
    });

    if (!company) {
      return NextResponse.json(
        { error: "No company found for this account." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const applicationId = parseInt(id);

    if (isNaN(applicationId)) {
      return NextResponse.json(
        { error: "Invalid application ID." },
        { status: 400 }
      );
    }

    // Fetch the application with student details
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        student: {
          include: {
            account: {
              select: {
                email: true,
                logoUrl: true
              }
            }
          }
        },
        jobPost: {
          select: {
            id: true,
            jobName: true,
            company_id: true
          }
        },
        resumeDocument: {
          select: {
            id: true,
            file_path: true,
            file_name: true
          }
        },
        portfolioDocument: {
          select: {
            id: true,
            file_path: true,
            file_name: true
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 }
      );
    }

    // Verify that the application belongs to this company
    if (application.jobPost.company_id !== company.id) {
      return NextResponse.json(
        { error: "You do not have permission to view this applicant." },
        { status: 403 }
      );
    }

    // Split name into first and last name
    const [firstname, ...lastnameParts] = application.student.name.split(" ");
    const lastname = lastnameParts.join(" ");

    // Generate signed URLs for documents (valid for 1 hour)
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let resumeUrl = null;
    let portfolioUrl = null;

    if (application.resumeDocument) {
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(application.resumeDocument.file_path, 3600);
      resumeUrl = data?.signedUrl || null;
    }

    if (application.portfolioDocument) {
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(application.portfolioDocument.file_path, 3600);
      portfolioUrl = data?.signedUrl || null;
    }

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
        resume_url: resumeUrl,
        resume_name: application.resumeDocument?.file_name || null,
        portfolio_url: portfolioUrl,
        portfolio_name: application.portfolioDocument?.file_name || null
      },
      applied_position: application.jobPost.jobName,
      applied_at: application.applied_at,
      // TODO: Add work experience and certifications when those models are added to schema
      work_experience: [],
      certification: []
    };

    return NextResponse.json({
      success: true,
      data: applicantInfo
    });

  } catch (error) {
    console.error("Error fetching applicant info:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
