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

    // Check if user is admin
    const adminAccount = await prisma.account.findUnique({
      where: { email: session.user.email },
      include: { accountRole: true }
    });

    if (!adminAccount || adminAccount.accountRole?.name?.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { accountId, accountType, action, reason } = await request.json();

    if (!accountId || !accountType || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    if (!["student", "company"].includes(accountType)) {
      return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
    }

    let message = "";
    let notificationMessage = "";

    if (accountType === "student") {
      // Get the student to access the account_id
      const student = await prisma.student.findFirst({
        where: { id: accountId }
      });

      if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }

      // Update student verification status
      await prisma.student.update({
        where: { id: accountId },
        data: {
          verification_status: action === "approve" ? "APPROVED" : "REJECTED",
          verified_at: action === "approve" ? new Date() : null,
          verified_by: action === "approve" ? adminAccount.id : null,
          verification_notes: reason || null
        }
      });

      notificationMessage = action === "approve"
        ? "Your alumni status has been approved! Please verify your KU email to complete registration and start applying for jobs."
        : `Your alumni verification has been rejected. ${reason ? `Reason: ${reason}` : ""}`;

      // Create notification for the student
      await prisma.notification.create({
        data: {
          account_id: student.account_id,
          message: notificationMessage
        }
      });

      message = `Student ${action === "approve" ? "approved" : "rejected"} successfully`;

    } else if (accountType === "company") {
      // Get the company to access the account_id
      const company = await prisma.company.findFirst({
        where: { id: accountId }
      });

      if (!company) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
      }

      // Update company registration status
      await prisma.company.update({
        where: { id: accountId },
        data: {
          registration_status: action === "approve" ? "approved" : "rejected"
        }
      });

      notificationMessage = action === "approve"
        ? "Your company registration has been approved! You can now post jobs and manage applications."
        : `Your company registration has been rejected. ${reason ? `Reason: ${reason}` : ""}`;

      // Create notification for the company
      await prisma.notification.create({
        data: {
          account_id: company.account_id,
          message: notificationMessage
        }
      });

      message = `Company ${action === "approve" ? "approved" : "rejected"} successfully`;
    }

    return NextResponse.json({
      message,
      success: true
    }, { status: 200 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to update account status" }, { status: 500 });
  }
}
