import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DOMPurify from "isomorphic-dompurify";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

// GET - Fetch all users with pagination and filtering
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role?.toLowerCase();
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    if (isNaN(page) || page < 1) return NextResponse.json({ error: "Invalid page" }, { status: 400 });
    if (isNaN(limit) || limit < 1) return NextResponse.json({ error: "Invalid limit" }, { status: 400 });

    const rawSearch = searchParams.get("search") || "";
    const rawRole = searchParams.get("role") || "";
    const rawStatus = searchParams.get("status") || "";

    // Canonicalize and sanitize inputs
    const search = DOMPurify.sanitize(rawSearch.trim());
    const role = DOMPurify.sanitize(rawRole.trim());
    const statusValue = DOMPurify.sanitize(rawStatus.trim());
    const statusParam = statusValue;

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { student: { name: { contains: search, mode: "insensitive" } } },
        { company: { name: { contains: search, mode: "insensitive" } } }
      ];
    }

    if (role && role !== "all") {
      whereClause.accountRole = { name: { equals: role.toLowerCase(), mode: "insensitive" } };
    }

    if (statusParam && statusParam !== "all") {
      whereClause.is_active = statusParam === "active";
    }

    // Exclude pending companies
    whereClause.NOT = { company: { registration_status: "pending" } };

    const [accounts, totalCount] = await Promise.all([
      prisma.account.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          username: true,
          created_at: true,
          updated_at: true,
          is_active: true,
          accountRole: { select: { id: true, name: true } },
          student: { select: { id: true, student_id: true, name: true, faculty: true, year: true, phone: true } },
          company: { select: { id: true, name: true, address: true, phone: true, description: true, website: true, registration_status: true } }
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit
      }),
      prisma.account.count({ where: whereClause })
    ]);

    const processedUsers = accounts.map(account => {
      const user: any = {
        id: account.id,
        name: DOMPurify.sanitize(account.username || account.email.split('@')[0]),
        email: DOMPurify.sanitize(account.email),
        role: account.accountRole?.name?.toLowerCase() || "unknown",
        isActive: account.is_active,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
        profile: {}
      };

      if (account.student) {
        user.profile = {
          phone: DOMPurify.sanitize(account.student.phone),
          department: DOMPurify.sanitize(account.student.faculty),
          studentId: DOMPurify.sanitize(account.student.student_id)
        };
      } else if (account.company) {
        user.profile = {
          phone: DOMPurify.sanitize(account.company.phone),
          location: DOMPurify.sanitize(account.company.address),
          companyName: DOMPurify.sanitize(account.company.name),
          companySize: DOMPurify.sanitize(account.company.description)
        };
      }

      return user;
    });

    return NextResponse.json({
      users: processedUsers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }, { status: 200 });

  } catch (error) {
    if (process.env.NODE_ENV === "development") {
        console.error("API error:", error);
    }
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
