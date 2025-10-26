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

    // Check if user is admin (using session role)
    const userRole = (session.user as any).role?.toLowerCase();
    console.log("🔍 User role:", userRole);

    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all reference data in parallel
    const [
      companies,
      jobTypes,
      jobArrangements,
      categories,
      tags
    ] = await Promise.all([
      prisma.company.findMany({
        where: { registration_status: "approved" },
        select: {
          id: true,
          name: true,
          account: {
            select: {
              email: true
            }
          }
        },
        orderBy: {
          name: "asc"
        }
      }),
      prisma.jobType.findMany({
        orderBy: {
          name: "asc"
        }
      }),
      prisma.jobArrangement.findMany({
        orderBy: {
          name: "asc"
        }
      }),
      prisma.jobCategory.findMany({
        orderBy: {
          name: "asc"
        }
      }),
      prisma.jobTag.findMany({
        orderBy: {
          name: "asc"
        }
      })
    ]);

    return NextResponse.json({
      companies,
      jobTypes,
      jobArrangements,
      categories,
      tags
    }, { status: 200 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch reference data" }, { status: 500 });
  }
}
