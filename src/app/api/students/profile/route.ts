import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

const logDebug = (...args: any[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(...args)
  }
}

/**
 * GET /api/students/profile
 * Fetch the current logged-in student's profile
 */
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
      student_status: student.student_status,
      verification_status: student.verification_status,
      email_verified: student.email_verified,
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
    logDebug("API error:", error);
    return NextResponse.json({ error: "Failed to fetch student profile" }, { status: 500 });
  }
}

/**
 * PUT /api/students/profile
 * Update the current logged-in student's profile
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    let { name, faculty, year, phone } = body;

    // Minimal canonicalization / sanitization for ASVS 1.1.1
    name = name?.trim().replace(/[<>\/"'`]/g, "") || "";
    faculty = faculty?.trim().replace(/[<>\/"'`]/g, "") || "";
    phone = phone?.trim().replace(/[^\d+()-]/g, "") || "";
    year = String(year);

    // Validate required fields
    const missingFields = [];
    if (!name) missingFields.push("name");
    if (!faculty) missingFields.push("faculty");
    if (!year) missingFields.push("year");
    if (!phone) missingFields.push("phone");

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: "Missing required fields",
        fields: missingFields,
        received: { name, faculty, year, phone }
      }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { account_id: parseInt(session.user.id) }
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        name,
        faculty,
        year,
        phone,
        account: { update: { username: name } }
      },
      include: {
        account: { include: { documents: true } }
      }
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
      student_status: updatedStudent.student_status,
      verification_status: updatedStudent.verification_status,
      email_verified: updatedStudent.email_verified,
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
    logDebug("API error:", error);
    return NextResponse.json({ error: "Failed to update student profile" }, { status: 500 });
  }
}
