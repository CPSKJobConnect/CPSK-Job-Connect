import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET - Fetch all users with pagination and filtering
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

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
      whereClause.accountRole = {
        name: role.charAt(0).toUpperCase() + role.slice(1)
      };
    }

    if (status && status !== "all") {
      // For now, all accounts will be considered as active since there's no isActive field
      whereClause.emailVerified = status === "active" ? { not: null } : null;
    }

    const [accounts, totalCount] = await Promise.all([
      prisma.account.findMany({
        where: whereClause,
        include: {
          accountRole: true,
          student: {
            select: {
              id: true,
              student_id: true,
              name: true,
              faculty: true,
              year: true,
              phone: true
            }
          },
          company: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              description: true,
              website: true,
              registration_status: true
            }
          }
        },
        orderBy: {
          created_at: "desc"
        },
        skip,
        take: limit
      }),
      prisma.account.count({ where: whereClause })
    ]);

    const processedUsers = accounts.map(account => {
      const user: any = {
        id: account.id,
        name: account.username || account.email.split('@')[0],
        email: account.email,
        role: account.accountRole?.name?.toLowerCase() || "unknown",
        isActive: !!account.emailVerified, // Consider verified accounts as active
        createdAt: account.created_at,
        updatedAt: account.updated_at,
        profile: {}
      };

      // Add role-specific profile information
      if (account.student) {
        user.profile = {
          phone: account.student.phone,
          location: account.student.faculty, // Using faculty as location for students
          department: account.student.faculty,
          studentId: account.student.student_id
        };
      } else if (account.company) {
        user.profile = {
          phone: account.company.phone,
          location: account.company.address,
          companyName: account.company.name,
          companySize: account.company.description // Using description as company size placeholder
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
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
