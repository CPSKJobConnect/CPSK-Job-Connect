import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getApiSession(request);
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
        resume: student.account.documents
          .filter(d => d.doc_type_id === 1)
          .map(d => ({ id: d.id, url: d.file_path, name: d.file_name, uploadedAt: d.created_at })),
        cv: student.account.documents
          .filter(d => d.doc_type_id === 2)
          .map(d => ({ id: d.id, url: d.file_path, name: d.file_name, uploadedAt: d.created_at })),
        portfolio: student.account.documents
          .filter(d => d.doc_type_id === 3)
          .map(d => ({ id: d.id, url: d.file_path, name: d.file_name, uploadedAt: d.created_at })),
        transcript: student.account.documents
          .filter(d => d.doc_type_id === 4)
          .map(d => ({ id: d.id, url: d.file_path, name: d.file_name, uploadedAt: d.created_at })),
      }
    };

    return NextResponse.json(responseStudent);

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getApiSession(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, faculty, year, phone } = body;

    // Validate required fields
    if (!name || !faculty || !year || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find student by session email
    const student = await prisma.student.findFirst({
      where: {
        account: { email: session.user.email }
      }
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Update student profile and account username
    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        name,
        faculty,
        year: String(year),
        phone,
        account: {
          update: {
            username: name
          }
        }
      },
      include: {
        account: {
          include: { documents: true }
        }
      }
    });

    const [firstname, ...lastnameParts] = updatedStudent.name.split(" ");
    const lastname = lastnameParts.join(" ");

    const responseStudent = {
      id: updatedStudent.id,
      account_id: updatedStudent.account_id,
      profile_url: updatedStudent.account.logoUrl ?? "",
      bg_profile_url: updatedStudent.account.backgroundUrl ?? "",
      email: updatedStudent.account.email,
      role: "student",
      student_id: updatedStudent.student_id,
      firstname,
      lastname,
      faculty: updatedStudent.faculty,
      year: Number(updatedStudent.year),
      phone: updatedStudent.phone,
      documents: {
        resume: updatedStudent.account.documents
          .filter(d => d.doc_type_id === 1)
          .map(d => ({ id: d.id, url: d.file_path, name: d.file_name, uploadedAt: d.created_at })),
        cv: updatedStudent.account.documents
          .filter(d => d.doc_type_id === 2)
          .map(d => ({ id: d.id, url: d.file_path, name: d.file_name, uploadedAt: d.created_at })),
        portfolio: updatedStudent.account.documents
          .filter(d => d.doc_type_id === 3)
          .map(d => ({ id: d.id, url: d.file_path, name: d.file_name, uploadedAt: d.created_at })),
        transcript: updatedStudent.account.documents
          .filter(d => d.doc_type_id === 4)
          .map(d => ({ id: d.id, url: d.file_path, name: d.file_name, uploadedAt: d.created_at })),
      }
    };

    return NextResponse.json(responseStudent);

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to update student profile" }, { status: 500 });
  }
}
