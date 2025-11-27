import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import DOMPurify from "isomorphic-dompurify"; // ✅ เพิ่มสำหรับ sanitization

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userRole = (session.user as any).role?.toLowerCase();
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // -----------------------------
    // ✅ OWASP ASVS 1.1.1 + 1.3.1
    // Sanitizing untrusted input (search, type, status)
    // -----------------------------
    const rawSearch = searchParams.get("search") || "";
    const rawType = searchParams.get("type") || "all";
    const rawStatus = searchParams.get("status") || "pending";

    const search = DOMPurify.sanitize(rawSearch);
    const accountType = DOMPurify.sanitize(rawType);
    const statusFilter = DOMPurify.sanitize(rawStatus);

    // Build where clauses for search
    const searchConditions = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { student: { name: { contains: search, mode: "insensitive" as const } } },
            { company: { name: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const pendingAccounts: {
      type: "student" | "company";
      id: number;
      accountId: number;
      name: string;
      email: string;
      status: string;
      createdAt: Date;
      details: any;
    }[] = [];

    // Build verification status filter for students
    const studentStatusFilter =
      statusFilter === "all"
        ? {}
        : {
            verification_status: statusFilter.toUpperCase() as
              | "PENDING"
              | "APPROVED"
              | "REJECTED",
          };

    // Fetch students
    if (accountType === "all" || accountType === "student") {
      const pendingStudents = await prisma.student.findMany({
        where: {
          student_status: "ALUMNI",
          ...studentStatusFilter,
          account: searchConditions,
        },
        include: {
          account: {
            select: {
              id: true,
              email: true,
              documents: {
                where: {
                  documentType: {
                    name: "Transcript",
                  },
                },
                include: {
                  documentType: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      pendingStudents.forEach((student) => {
        const isReapplication = student.account.documents.length > 1;
        pendingAccounts.push({
          type: "student",
          id: student.id,
          accountId: student.account.id,
          name: student.name,
          email: student.account.email,
          status: student.verification_status,
          createdAt: student.created_at,
          details: {
            studentId: student.student_id,
            faculty: student.faculty,
            year: student.year,
            phone: student.phone,
            transcript: student.transcript,
            documents: student.account.documents,
            isReapplication,
          },
        });
      });
    }

    // Build registration status filter for companies
    const companyStatusFilter =
      statusFilter === "all"
        ? {}
        : {
            registration_status: statusFilter.toUpperCase() as
              | "PENDING"
              | "APPROVED"
              | "REJECTED",
          };

    // Fetch companies
    if (accountType === "all" || accountType === "company") {
      const pendingCompanies = await prisma.company.findMany({
        where: {
          ...companyStatusFilter,
          account: searchConditions,
        },
        include: {
          account: {
            select: {
              id: true,
              email: true,
              documents: {
                where: {
                  documentType: {
                    name: "Company Evidence",
                  },
                },
                include: {
                  documentType: true,
                },
              },
            },
          },
        },
        orderBy: {
          register_day: "desc",
        },
      });

      pendingCompanies.forEach((company) => {
        const isReapplication = company.account.documents.length > 1;

        pendingAccounts.push({
          type: "company",
          id: company.id,
          accountId: company.account.id,
          name: company.name,
          email: company.account.email,
          status: company.registration_status,
          createdAt: company.register_day,
          details: {
            address: company.address,
            phone: company.phone,
            description: company.description,
            website: company.website,
            documents: company.account.documents,
            isReapplication,
          },
        });
      });
    }

    pendingAccounts.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    return NextResponse.json(pendingAccounts, { status: 200 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending accounts" },
      { status: 500 }
    );
  }
}
