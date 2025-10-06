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

    const student = await prisma.student.findFirst({
      where: {
        account: { email: session.user.email }
      },
      include: {
        account: {
          include: { documents: true }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const [firstname, ...lastnameParts] = student.name.split(" ");
    const lastname = lastnameParts.join(" ");

    const responseStudent = {
      id: student.id,
      account_id: student.account_id,
      profile_url: student.account.logoUrl ?? "",
      bg_profile_url: student.account.backgroundUrl ?? "",
      email: student.account.email,
      role: "student",
      student_id: student.student_id,
      firstname,
      lastname,
      faculty: student.faculty,
      year: Number(student.year),
      phone: student.phone,
      documents: {
        resume: student.account.documents.filter(d => d.doc_type_id === 1),
        cv: student.account.documents.filter(d => d.doc_type_id === 2),
        portfolio: student.account.documents.filter(d => d.doc_type_id === 3),
      }
    };

    return NextResponse.json(responseStudent);

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 });
  }
}
