import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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

    const { companyId, action, reason } = await request.json();

    if (!companyId || !action || !["approved", "rejected"].includes(action)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    // Update company registration status
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        registration_status: action === "approved" ? "approved" : "rejected"
      },
      include: {
        account: true
      }
    });

    // Create notification for the company
    await prisma.notification.create({
      data: {
        account_id: updatedCompany.account_id,
        message: action === "approved"
          ? "Your company registration has been approved! You can now post jobs and manage applications."
          : `Your company registration has been rejected. ${reason ? `Reason: ${reason}` : ""}`
      }
    });

    return NextResponse.json({
      message: `Company ${action} successfully`,
      company: updatedCompany
    }, { status: 200 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to update company status" }, { status: 500 });
  }
}
