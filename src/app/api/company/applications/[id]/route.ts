import { getApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { account_id: parseInt(session.user.id) },
      select: { id: true }
    });

    if (!company) {
      return NextResponse.json(
        { error: "No company found for this account." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const applicationId = parseInt(id);
    if (isNaN(applicationId)) {
      return NextResponse.json(
        { error: "Invalid application ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status || typeof status !== "string") {
      return NextResponse.json(
        { error: "Status is required and must be a string." },
        { status: 400 }
      );
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        jobPost: { select: { jobName: true, company_id: true } },
        student: { include: { account: true } },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    if (application.jobPost.company_id !== company.id) {
      return NextResponse.json(
        { error: "You do not have permission to update this application." },
        { status: 403 }
      );
    }

    const applicationStatus = await prisma.applicationStatus.findFirst({
      where: { name: { equals: status, mode: "insensitive" } },
    });

    if (!applicationStatus) {
      return NextResponse.json(
        { error: `Invalid status: ${status}` },
        { status: 400 }
      );
    }

    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status: applicationStatus.id },
      include: {
        applicationStatus: { select: { name: true } },
        jobPost: { select: { jobName: true } },
        student: { include: { account: true } },
      },
    });

    const message = `Your application for "${updatedApplication.jobPost.jobName}" has been updated to "${updatedApplication.applicationStatus.name}".`;

    await prisma.notification.create({
      data: {
        account_id: updatedApplication.student.account.id,
        message,
        sender_id: Number(session.user.id),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedApplication.id,
        status: updatedApplication.applicationStatus.name.toLowerCase(),
        updated_at: updatedApplication.updated_at.toISOString(),
      },
    });

  } catch (error) {
    console.error("Error updating application status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
