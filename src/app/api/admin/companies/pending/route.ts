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

    // Fetch pending companies with their evidence documents
    const pendingCompanies = await prisma.company.findMany({
      where: {
        registration_status: "pending"
      },
      include: {
        account: {
          include: {
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

    return NextResponse.json(pendingCompanies, { status: 200 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch pending companies" }, { status: 500 });
  }
}
