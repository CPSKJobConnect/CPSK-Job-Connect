import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find student by session email
    const student = await prisma.student.findFirst({
      where: {
        account: { email: session.user.email }
      }
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get all applications for this student
    const applications = await prisma.application.findMany({
      where: {
        student_id: student.id
      },
      include: {
        jobPost: {
          include: {
            company: {
              include: {
                account: true
              }
            },
            jobType: true,
            jobArrangement: true
          }
        },
        applicationStatus: true,
        resumeDocument: true,
        portfolioDocument: true
      },
      orderBy: {
        applied_at: 'desc'
      }
    });

    // Format the response
    const formattedApplications = applications.map(app => ({
      id: app.id,
      status: app.applicationStatus.name,
      applied_at: app.applied_at,
      updated_at: app.updated_at,
      job: {
        id: app.jobPost.id,
        jobName: app.jobPost.jobName,
        location: app.jobPost.location,
        jobType: app.jobPost.jobType.name,
        jobArrangement: app.jobPost.jobArrangement.name,
        min_salary: app.jobPost.min_salary,
        max_salary: app.jobPost.max_salary,
        deadline: app.jobPost.deadline,
        company: {
          id: app.jobPost.company.id,
          name: app.jobPost.company.name,
          logoUrl: app.jobPost.company.account.logoUrl
        }
      },
      documents: {
        resume: app.resumeDocument ? {
          id: app.resumeDocument.id,
          file_name: app.resumeDocument.file_name,
          file_path: app.resumeDocument.file_path
        } : null,
        portfolio: app.portfolioDocument ? {
          id: app.portfolioDocument.id,
          file_name: app.portfolioDocument.file_name,
          file_path: app.portfolioDocument.file_path
        } : null
      }
    }));

    return NextResponse.json(formattedApplications);

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}
