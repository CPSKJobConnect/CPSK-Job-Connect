import { getApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/company/recent-applications
 *
 * Returns the most recent applications for the logged-in company
 *
 * Query Parameters:
 * - limit: number (default: 5) - How many applications to return
 * - offset: number (default: 0) - For pagination
 *
 * Example: /api/company/recent-applications?limit=5
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
    const offsetParam = request.nextUrl.searchParams.get("offset");
    const limit = limitParam ? parseInt(limitParam) : 5;
    const offset = offsetParam ? parseInt(offsetParam) : 0;

    const totalApplications = await prisma.application.count({
      where: {
        jobPost: { company_id: companyId }
      }
    });

    const applications = await prisma.application.findMany({
      where: {
        jobPost: { company_id: companyId }
      },
      include: {
        student: {
          include: {
            account: {
              select: {
                id: true,
                email: true,
                logoUrl: true // This is the profile picture
              }
            }
          }
        },
        jobPost: {
          select: {
            id: true,
            jobName: true
          }
        },
        applicationStatus: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        applied_at: "desc"
      },
      take: limit,
      skip: offset
    });

    const formattedApplications = applications.map((app) => ({
      id: app.id,
      applicant: {
        id: app.student.id,
        name: app.student.name,
        email: app.student.account.email,
        profile_url: app.student.account.logoUrl || null
      },
      job: {
        id: app.jobPost.id,
        title: app.jobPost.jobName
      },
      status: app.applicationStatus.name.toLowerCase(),
      applied_at: app.applied_at.toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: {
        applications: formattedApplications,
        total: totalApplications,
        limit: limit,
        offset: offset
      }
    });

  } catch (error) {
    console.error("Error fetching recent applications:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
