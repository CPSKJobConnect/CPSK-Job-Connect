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

    // Get the account
    const account = await prisma.account.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        logoUrl: true,
        backgroundUrl: true,
        accountRole: {
          select: { name: true }
        }
      }
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Get company details
    const company = await prisma.company.findUnique({
      where: { account_id: account.id },
      include: {
        account: {
          include: {
            documents: {
              where: {
                doc_type_id: 7 // Company Evidence documents
              },
              include: {
                documentType: true
              },
              orderBy: {
                created_at: 'desc'
              }
            }
          }
        }
      }
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Format response to match Company interface
    const response = {
      id: company.id,
      account_id: company.account_id,
      profile_url: account.logoUrl || "",
      bg_profile_url: account.backgroundUrl || "",
      email: account.email,
      role: account.accountRole?.name?.toLowerCase() || "company",
      name: company.name,
      address: [company.address], // Convert to array for compatibility
      description: company.description,
      department: [], // Companies don't have departments in schema, empty array for compatibility
      year: new Date().getFullYear(), // Not used for companies but required by interface
      phone: company.phone,
      registration_status: company.registration_status as "PENDING" | "APPROVED" | "REJECTED",
      documents: {
        evidence: company.account.documents.map(doc => ({
          id: doc.id,
          name: doc.file_name,
          url: doc.file_path,
          uploadedAt: doc.created_at.toISOString(),
          type: doc.documentType.name
        }))
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return NextResponse.json({ error: "Failed to fetch company profile" }, { status: 500 });
  }
}
