import { getApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/company/top-jobs
 *
 * Returns the top performing job posts by application count
 *
 * Query Parameters:
 * - limit: number (default: 5) - How many jobs to return
 * - sortBy: "applications" | "views" (default: "applications")
 *
 * Example: /api/company/top-jobs?limit=5
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
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 5;
    const now = new Date();

    const jobs = await prisma.jobPost.findMany({
      where: {
        company_id: companyId
      },
      include: {
        applications: {
          select: {
            id: true
          }
        }
      },
      take: limit * 2
    });

    const jobsWithStats = jobs.map((job: { id: number; jobName: string; is_Published: boolean; deadline: Date; applications: { id: number }[] }) => {
      let status: "active" | "draft" | "closed";

      if (!job.is_Published) {
        status = "draft";
      } else if (job.deadline < now) {
        status = "closed";
      } else {
        status = "active";
      }

      return {
        id: job.id,
        title: job.jobName,
        applications: job.applications.length,
        views: 0,
        status: status
      };
    });

    jobsWithStats.sort((a: { applications: number }, b: { applications: number }) => b.applications - a.applications);
    const topJobs = jobsWithStats.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        jobs: topJobs
      }
    });

  } catch (error) {
    console.error("Error fetching top jobs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
