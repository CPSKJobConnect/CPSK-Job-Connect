import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const accountId = parseInt(id, 10); // ใช้ parseInt กับ radix

    if (isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { account_id: accountId },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Execute all count queries in parallel for better performance
    const [applicationsSent, interviewsScheduled, offersReceived, savedJobs] = await Promise.all([
      prisma.application.count({
        where: { student_id: student.id },
      }),
      prisma.application.count({
        where: { student_id: student.id, status: 3 },
      }),
      prisma.application.count({
        where: { student_id: student.id, status: 4 },
      }),
      prisma.savedJob.count({
        where: { student_id: student.id },
      }),
    ]);

    return NextResponse.json({
      applicationsSent,
      interviewsScheduled,
      offersReceived,
      savedJobs,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching student summary:", error);
    }
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
