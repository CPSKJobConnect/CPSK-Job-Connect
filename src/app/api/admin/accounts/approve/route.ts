import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { sendAlumniStatusEmail, sendCompanyStatusEmail } from "@/lib/email";

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
      // Get the student to access the account_id and account email
      const student = await prisma.student.findFirst({
        where: { id: accountId },
        include: {
          account: {
            select: {
              email: true
            }
          }
        }
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
          verification_notes: reason || null,
          // Reset email verification if rejecting (they need to re-upload and re-verify)
          email_verified: action === "reject" ? false : undefined
        }
      });

      notificationMessage = action === "approve"
        ? "Your alumni status has been approved! Please verify your KU email to complete registration and start applying for jobs."
        : `Your alumni verification has been rejected. ${reason ? `Reason: ${reason}` : ""}`;

      // Create notification for the student with admin as sender
      await prisma.notification.create({
        data: {
          account_id: student.account_id,
          sender_id: adminAccount.id,
          message: notificationMessage
        }
      });

      // Send email notification
      try {
        await sendAlumniStatusEmail(
          student.account.email,
          student.name,
          action === "approve",
          reason
        );
        console.log(`✅ Email sent to ${student.account.email}`);
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${student.account.email}:`, emailError);
        // Continue even if email fails - notification is still created
      }

      message = `Student ${action === "approve" ? "approved" : "rejected"} successfully`;

    } else if (accountType === "company") {
      // Get the company to access the account_id and account email
      const company = await prisma.company.findFirst({
        where: { id: accountId },
        include: {
          account: {
            select: {
              email: true
            }
          }
        }
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

      // Create notification for the company with admin as sender
      await prisma.notification.create({
        data: {
          account_id: company.account_id,
          sender_id: adminAccount.id,
          message: notificationMessage
        }
      });

      // Send email notification
      try {
        await sendCompanyStatusEmail(
          company.account.email,
          company.name,
          action === "approve",
          reason
        );
        console.log(`✅ Email sent to ${company.account.email}`);
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${company.account.email}:`, emailError);
        // Continue even if email fails - notification is still created
      }

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
