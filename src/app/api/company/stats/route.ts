import { getApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/company/stats
 *
 * Returns statistics for the logged-in company's dashboard
 */
export async function GET(request: NextRequest) {
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

    const companyId = company.id;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const now = new Date();

    const [
      totalJobs,
      activeJobs,
      draftJobs,
      closedJobs,
      totalApplications,
      newApplications,
      pendingApplications,
      reviewedApplications,
      interviewedApplications,
      offeredApplications,
    ] = await Promise.all([
      prisma.jobPost.count({
        where: { company_id: companyId }
      }),
      prisma.jobPost.count({
        where: {
          company_id: companyId,
          is_Published: true,
          deadline: { gte: now }
        }
      }),
      prisma.jobPost.count({
        where: {
          company_id: companyId,
          is_Published: false
        }
      }),
      prisma.jobPost.count({
        where: {
          company_id: companyId,
          deadline: { lt: now }
        }
      }),
      prisma.application.count({
        where: {
          jobPost: { company_id: companyId }
        }
      }),
      prisma.application.count({
        where: {
          jobPost: { company_id: companyId },
          applied_at: { gte: startOfToday }
        }
      }),
      prisma.application.count({
        where: {
          jobPost: { company_id: companyId },
          status: 1
        }
      }),
      prisma.application.count({
        where: {
          jobPost: { company_id: companyId },
          status: 2
        }
      }),
      prisma.application.count({
        where: {
          jobPost: { company_id: companyId },
          status: 3
        }
      }),
      prisma.application.count({
        where: {
          jobPost: { company_id: companyId },
          status: 4
        }
      }),
    ]);

    const stats = {
      totalJobs,
      activeJobs,
      draftJobs,
      closedJobs,
      totalApplications,
      newApplications,
      pendingApplications,
      reviewedApplications,
      interviewsScheduled: interviewedApplications,
      offersExtended: offeredApplications,
      offersAccepted: offeredApplications,
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Error fetching company stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
