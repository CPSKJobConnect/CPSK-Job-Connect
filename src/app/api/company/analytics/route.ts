import { getApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/company/analytics
 *
 * Returns analytics data for the logged-in company's dashboard
 *
 * Query Parameters:
 * - type: "trend" | "status" (required)
 * - period: "week" | "month" | "year" (optional, only for type=trend)
 *
 * Examples:
 * - /api/company/analytics?type=trend&period=month
 * - /api/company/analytics?type=status
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
    const type = request.nextUrl.searchParams.get("type");
    const period = request.nextUrl.searchParams.get("period") || "month";

    if (type !== "trend" && type !== "status") {
      return NextResponse.json(
        { error: "Invalid type parameter. Must be 'trend' or 'status'." },
        { status: 400 }
      );
    }

    if (type === "trend") {
      const endDate = new Date();
      const startDate = new Date();

      if (period === "week") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === "month") {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (period === "year") {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      const applications = await prisma.application.findMany({
        where: {
          jobPost: { company_id: companyId },
          applied_at: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          applied_at: true
        },
        orderBy: {
          applied_at: "asc"
        }
      });

      const trendMap = new Map<string, number>();

      applications.forEach((app) => {
        const dateKey = app.applied_at.toISOString().split('T')[0];
        trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + 1);
      });

      const trend = Array.from(trendMap, ([date, applications]) => ({
        date,
        applications
      }));

      return NextResponse.json({
        success: true,
        data: {
          trend,
          period,
          total: applications.length
        }
      });

    } else if (type === "status") {
      const [
        pendingCount,
        reviewedCount,
        interviewedCount,
        offeredCount,
        rejectedCount
      ] = await Promise.all([
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
        prisma.application.count({
          where: {
            jobPost: { company_id: companyId },
            status: 5
          }
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          pending: pendingCount,
          reviewed: reviewedCount,
          interviewed: interviewedCount,
          offered: offeredCount,
          rejected: rejectedCount
        }
      });
    }

  } catch (error) {
    console.error("Error fetching company analytics:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
