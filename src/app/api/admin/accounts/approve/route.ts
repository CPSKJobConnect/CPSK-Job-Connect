import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { sendAlumniStatusEmail, sendCompanyStatusEmail } from "@/lib/email";
import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";

const logDebug = (...args: any[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(...args)
  }
}

// ✅ Zod Input Validation (ASVS 1.1.1)
const ApproveSchema = z.object({
  accountId: z.number(),
  accountType: z.enum(["student", "company"]),
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(1000).optional()
});

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

    // Validate & sanitize input
    const rawData = await request.json();
    const parsed = ApproveSchema.safeParse(rawData);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const { accountId, accountType, action } = parsed.data;
    const reason = parsed.data.reason
      ? DOMPurify.sanitize(parsed.data.reason) // ✅ HTML sanitization (ASVS 1.3.1)
      : null;

    let message = "";
    let notificationMessage = "";

    if (accountType === "student") {
      const student = await prisma.student.findFirst({
        where: { id: accountId },
        include: {
          account: { select: { email: true } }
        }
      });

      if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }

      await prisma.student.update({
        where: { id: accountId },
        data: {
          verification_status: action === "approve" ? "APPROVED" : "REJECTED",
          verified_at: action === "approve" ? new Date() : null,
          verified_by: action === "approve" ? adminAccount.id : null,
          verification_notes: reason,
          email_verified: action === "reject" ? false : undefined
        }
      });

      notificationMessage =
        action === "approve"
          ? "Your alumni status has been approved! Please verify your KU email."
          : `Your alumni verification has been rejected. ${reason ? `Reason: ${reason}` : ""}`;

      await prisma.notification.create({
        data: {
          account_id: student.account_id,
          sender_id: adminAccount.id,
          message: notificationMessage
        }
      });

      try {
        await sendAlumniStatusEmail(
          student.account.email,
          student.name,
          action === "approve",
          reason || undefined
        );
      } catch (emailError) {
        logDebug(`❌ Failed to send email to ${student.account.email}:`, emailError);
      }

      message = `Student ${action === "approve" ? "approved" : "rejected"} successfully`;

    } else if (accountType === "company") {

      const company = await prisma.company.findFirst({
        where: { id: accountId },
        include: {
          account: { select: { email: true } }
        }
      });

      if (!company) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
      }

      await prisma.company.update({
        where: { id: accountId },
        data: {
          registration_status: action === "approve" ? "APPROVED" : "REJECTED",
          verified_at: new Date(),
          verified_by: adminAccount.id,
          verification_notes: action === "reject" ? reason : null
        }
      });

      notificationMessage =
        action === "approve"
          ? "Your company registration has been approved!"
          : `Your company registration has been rejected. ${reason ? `Reason: ${reason}` : ""}`;

      await prisma.notification.create({
        data: {
          account_id: company.account_id,
          sender_id: adminAccount.id,
          message: notificationMessage
        }
      });

      try {
        await sendCompanyStatusEmail(
          company.account.email,
          company.name,
          action === "approve",
          reason || undefined
        );
      } catch (emailError) {
        logDebug(`❌ Failed to send email to ${company.account.email}:`, emailError);
      }

      message = `Company ${action === "approve" ? "approved" : "rejected"} successfully`;
    }

    return NextResponse.json({ message, success: true }, { status: 200 });

  } catch (error) {
    logDebug("API error:", error);
    return NextResponse.json({ error: "Failed to update account status" }, { status: 500 });
  }
}
