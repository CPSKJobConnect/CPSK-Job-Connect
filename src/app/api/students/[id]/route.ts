import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import DOMPurify from "isomorphic-dompurify";

export async function GET(request: NextRequest) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: {
        account_id: parseInt(session.user.id)
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

    // Handle year field: can be numeric (1-8) or "Alumni"
    const yearValue = student.year === "Alumni" ? "Alumni" : Number(student.year);

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
      year: yearValue,
      phone: student.phone,
      documents: {
        resume: student.account.documents
          .filter((d: { doc_type_id: number }) => d.doc_type_id === 1)
          .map((d: { id: number; file_path: string; file_name: string; created_at: Date }) => ({ id: d.id, url: d.file_path, name: d.file_name, uploadedAt: d.created_at })),
        cv: student.account.documents
          .filter((d: { doc_type_id: number }) => d.doc_type_id === 2)
          .map((d: { id: number; file_path: string; file_name: string; created_at: Date }) => ({ id: d.id, url: d.file_path, name: d.file_name, uploadedAt: d.created_at })),
        portfolio: student.account.documents
          .filter((d: { doc_type_id: number }) => d.doc_type_id === 3)
          .map((d: { id: number; file_path: string; file_name: string; created_at: Date }) => ({ id: d.id, url: d.file_path, name: d.file_name, uploadedAt: d.created_at })),
        transcript: student.account.documents
          .filter((d: { doc_type_id: number }) => d.doc_type_id === 4)
          .map((d: { id: number; file_path: string; file_name: string; created_at: Date }) => ({ id: d.id, url: d.file_path, name: d.file_name, uploadedAt: d.created_at })),
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
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    let { name, faculty, year, phone } = body;

    // canonicalization / trim
    name = name?.trim() ?? "";
    faculty = faculty?.trim() ?? "";
    phone = phone?.trim() ?? "";
    year = year ?? "";

    const missingFields = [];
    if (!name) missingFields.push("name");
    if (!faculty) missingFields.push("faculty");
    if (!year && year !== 0) missingFields.push("year");
    if (!phone) missingFields.push("phone");
    if (missingFields.length > 0) return NextResponse.json({ error: "Missing required fields", fields: missingFields }, { status: 400 });

    // sanitize strings
    const nameSanitized = DOMPurify.sanitize(name);
    const facultySanitized = DOMPurify.sanitize(faculty);
    const phoneSanitized = DOMPurify.sanitize(phone);

    const student = await prisma.student.findUnique({
      where: { account_id: parseInt(session.user.id, 10) }
    });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        name: nameSanitized,
        faculty: facultySanitized,
        year: String(year),
        phone: phoneSanitized,
        account: { update: { username: nameSanitized } }
      },
      include: { account: { include: { documents: true } } }
    });

    const [firstname, ...lastnameParts] = updatedStudent.name.split(" ");
    const lastname = lastnameParts.join(" ");
    const yearValueUpdated = updatedStudent.year === "Alumni" ? "Alumni" : Number(updatedStudent.year);

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
      year: yearValueUpdated,
      phone: updatedStudent.phone,
      documents: updatedStudent.account.documents.map(d => ({
        id: d.id,
        url: d.file_path,
        name: d.file_name,
        uploadedAt: d.created_at
      }))
    };

    return NextResponse.json(responseStudent);

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to update student profile" }, { status: 500 });
  }
}
