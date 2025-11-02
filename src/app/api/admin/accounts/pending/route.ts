import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const account = await prisma.account.findUnique({
      where: { email: session.user.email },
      include: { accountRole: true }
    });

    if (!account || account.accountRole?.name?.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const accountType = searchParams.get("type") || "all"; // "all", "student", "company"

    // Build where clauses for search
    const searchConditions = search ? {
      OR: [
        { email: { contains: search, mode: "insensitive" as const } },
        { student: { name: { contains: search, mode: "insensitive" as const } } },
        { company: { name: { contains: search, mode: "insensitive" as const } } },
      ]
    } : {};

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

    // Fetch pending students (alumni with PENDING verification status)
    if (accountType === "all" || accountType === "student") {
      const pendingStudents = await prisma.student.findMany({
        where: {
          student_status: "ALUMNI",
          verification_status: "PENDING",
          account: searchConditions
        },
        include: {
          account: {
            select: {
              id: true,
              email: true,
              documents: {
                where: {
                  documentType: {
                    name: "Transcript"
                  }
                },
                include: {
                  documentType: true
                }
              }
            }
          }
        },
        orderBy: {
          created_at: "desc"
        }
      });

      pendingStudents.forEach(student => {
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
            documents: student.account.documents
          }
        });
      });
    }

    // Fetch pending companies
    if (accountType === "all" || accountType === "company") {
      const pendingCompanies = await prisma.company.findMany({
        where: {
          registration_status: "pending",
          account: searchConditions
        },
        include: {
          account: {
            select: {
              id: true,
              email: true,
              documents: {
                where: {
                  documentType: {
                    name: "Company Evidence"
                  }
                },
                include: {
                  documentType: true
                }
              }
            }
          }
        },
        orderBy: {
          register_day: "desc"
        }
      });

      pendingCompanies.forEach(company => {
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
            documents: company.account.documents
          }
        });
      });
    }

    // Sort by creation date (newest first)
    pendingAccounts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json(pendingAccounts, { status: 200 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch pending accounts" }, { status: 500 });
  }
}
