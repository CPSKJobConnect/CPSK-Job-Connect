import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const jobId = Number(id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const applicants = await prisma.application.findMany({
      where: { job_post_id: jobId },
      select: {
        id: true,
        student: {
          select: {
            name: true,
            id: true,
            student_id: true,
            phone: true,
            account: { select: { email: true, logoUrl: true } },
          },
        },
        status: true,
        applied_at: true,
        portfolioDocument: { select: { file_path: true } },
        resumeDocument: { select: { file_path: true } },
      },
    });

    const mappedApplicants = await Promise.all(
      applicants.map(async (a) => {
        let resumeUrl: string | null = null;
        let portfolioUrl: string | null = null;

        if (a.resumeDocument?.file_path) {
          const { data } = await supabase.storage
            .from("documents")
            .createSignedUrl(a.resumeDocument.file_path, 60 * 60 * 24 * 7); // 7 วัน
          resumeUrl = data?.signedUrl ?? null;
        }

        if (a.portfolioDocument?.file_path) {
          const { data } = await supabase.storage
            .from("documents")
            .createSignedUrl(a.portfolioDocument.file_path, 60 * 60 * 24 * 7);
          portfolioUrl = data?.signedUrl ?? null;
        }

        return {
          application_id: a.id, // This is the application ID, needed for /api/company/applicants/[id]
          applicant_id: a.student.id, // This is the actual student/applicant ID
          name: a.student.name,
          student_id: a.student.student_id,
          email: a.student.account.email,
          profile_url: a.student.account.logoUrl,
          phone: a.student.phone,
          status: a.status,
          applied_at: a.applied_at,
          portfolio: portfolioUrl,
          resume: resumeUrl,
        };
      })
    );

    return NextResponse.json({ job_id: jobId, applicants: mappedApplicants });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch applicants" },
      { status: 500 }
    );
  }
}
