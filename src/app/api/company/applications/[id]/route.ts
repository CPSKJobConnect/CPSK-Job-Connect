import { getApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/company/applications/[id]
 *
 * Updates the status of a specific application
 *
 * Request Body:
 * - status: string (pending, reviewed, interviewed, accepted, rejected)
 *
 * Example: PATCH /api/company/applications/123
 * Body: { "status": "reviewed" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const applicationId = parseInt(params.id);
    if (isNaN(applicationId)) {
      return NextResponse.json(
        { error: "Invalid application ID." },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { status } = body;

    if (!status || typeof status !== "string") {
      return NextResponse.json(
        { error: "Status is required and must be a string." },
        { status: 400 }
      );
    }

    // Validate that the application belongs to this company
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        jobPost: {
          select: {
            company_id: true
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 }
      );
    }

    if (application.jobPost.company_id !== company.id) {
      return NextResponse.json(
        { error: "You do not have permission to update this application." },
        { status: 403 }
      );
    }

    // Get the status ID from the status name
    const applicationStatus = await prisma.applicationStatus.findFirst({
      where: {
        name: {
          equals: status,
          mode: "insensitive"
        }
      }
    });

    if (!applicationStatus) {
      return NextResponse.json(
        { error: `Invalid status: ${status}. Valid statuses are: pending, reviewed, interviewed, accepted, rejected` },
        { status: 400 }
      );
    }

    // Update the application status
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: applicationStatus.id
      },
      include: {
        applicationStatus: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedApplication.id,
        status: updatedApplication.applicationStatus.name.toLowerCase(),
        updated_at: updatedApplication.updated_at.toISOString()
      }
    });

  } catch (error) {
    console.error("Error updating application status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
