import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import DOMPurify from "isomorphic-dompurify"; // สำหรับ sanitize input หากใช้ query params
import { Prisma } from "@prisma/client";

// Utility: canonicalize string input safely
function canonicalize(input: string | null): string | undefined {
  if (!input) return undefined;
  const decoded = decodeURIComponent(input); // decode once
  return DOMPurify.sanitize(decoded); // sanitize to remove any unexpected HTML/JS
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (using session role)
    const userRole = (session.user as any).role?.toLowerCase();
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Optional: handle query params safely
    const { searchParams } = new URL(request.url);
    const search = canonicalize(searchParams.get("search"));
    const status = canonicalize(searchParams.get("status"));
    const page = Number(canonicalize(searchParams.get("page")) || 1);
    const limit = Number(canonicalize(searchParams.get("limit")) || 10);

    // Build whereClause safely if search/status is used in future
    const whereClause: Prisma.CompanyWhereInput = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) {
      // example: filter by registration status
      whereClause.registration_status = status;
    }

    // Fetch all reference data in parallel
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
          account: { select: { email: true } }
        },
        orderBy: { name: "asc" }
      }),
      prisma.jobType.findMany({ orderBy: { name: "asc" } }),
      prisma.jobArrangement.findMany({ orderBy: { name: "asc" } }),
      prisma.jobCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.jobTag.findMany({ orderBy: { name: "asc" } })
    ]);

    return NextResponse.json({
      companies,
      jobTypes,
      jobArrangements,
      categories,
      tags,
      pagination: { page, limit }
    }, { status: 200 });

  } catch (error) {
    if (process.env.NODE_ENV === "development") {
        console.error("API error:", error);
    }
    return NextResponse.json({ error: "Failed to fetch reference data" }, { status: 500 });
  }
}
