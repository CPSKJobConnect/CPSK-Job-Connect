import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

export async function GET(request: Request, context: { params: { id: string } }) {
  try {
    const params = await context.params;
    const accountId = Number(params.id);

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

    const applications = await prisma.application.groupBy({
      by: ["applied_at"],
      where: { student_id: student.id },
      _count: { id: true },
      orderBy: { applied_at: "asc" },
    });

    const formattedData = applications.map((item) => ({
      date: format(new Date(item.applied_at), "dd/MM/yyyy"),
      applicants: item._count.id,
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error fetching applicant data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
