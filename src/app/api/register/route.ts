import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyAdminsNewAlumni, notifyAdminsNewCompany } from "@/lib/notifyAdmins";
import {
  companyOAuthRegisterSchema,
  companyRegisterSchema,
  studentOAuthRegisterSchema,
  studentRegisterSchema
} from "@/lib/validations";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";

type StudentData = z.infer<typeof studentRegisterSchema>;
type CompanyData = z.infer<typeof companyRegisterSchema>;
type StudentOAuthData = z.infer<typeof studentOAuthRegisterSchema>;
type CompanyOAuthData = z.infer<typeof companyOAuthRegisterSchema>;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Canonicalize role
    const role = String(formData.get("role") ?? "").trim();
    const isOAuth = formData.get("isOAuth") === "true";

    if (!["student", "company"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // OAuth session check
    if (isOAuth) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized - OAuth session required" }, { status: 401 });
      }
    }

    // Convert FormData to object with canonicalization + sanitization
    const data: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (key !== "transcript" && key !== "evidence" && key !== "role") {
        let val = typeof value === "string" ? value.trim() : value;

        // Sanitize free-text inputs
        if (["name", "companyName", "description", "username"].includes(key) && typeof val === "string") {
          val = sanitizeHtml(val, { allowedTags: [], allowedAttributes: {} });
        }

        if (key === "year") {
          data[key] = val === "Alumni" ? "Alumni" : parseInt(val as string);
        } else {
          data[key] = val;
        }
      }
    }

    // Canonicalize studentStatus
    const studentStatus = formData.get("studentStatus");
    if (studentStatus) {
      data.studentStatus = String(studentStatus).trim();
    }

    // Add transcript/evidence files
    const transcriptFile = formData.get("transcript") as File | null;
    const evidenceFile = formData.get("evidence") as File | null;

    if (role === "student" && transcriptFile && transcriptFile.size > 0) {
      data.transcript = transcriptFile;
    }

    if (role === "company" && evidenceFile && evidenceFile.size > 0) {
      data.evidence = evidenceFile;
    }

    // Validate data
    let validatedData: z.ZodSafeParseResult<StudentData | CompanyData | StudentOAuthData | CompanyOAuthData>;
    if (role === "student") {
      validatedData = isOAuth
        ? studentOAuthRegisterSchema.safeParse(data)
        : studentRegisterSchema.safeParse(data);
    } else {
      validatedData = isOAuth
        ? companyOAuthRegisterSchema.safeParse(data)
        : companyRegisterSchema.safeParse(data);
    }

    if (!validatedData.success) {
      console.error("❌ Validation failed:", validatedData.error.issues);
      return NextResponse.json({ error: "Invalid data", details: validatedData.error.issues }, { status: 400 });
    }

    // Check existing account
    const existingUser = await prisma.account.findUnique({
      where: { email: validatedData.data.email },
      include: { student: true, company: true }
    });

    if (existingUser && (existingUser.student || existingUser.company)) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    if (existingUser && !isOAuth) {
      await prisma.account.delete({ where: { id: existingUser.id } });
    }

    // Hash password for non-OAuth
    let hashedPassword: string | null = null;
    if (!isOAuth) {
      const dataWithPassword = validatedData.data as StudentData | CompanyData;
      hashedPassword = await bcrypt.hash(dataWithPassword.password, 12);
    }

    // Get or create role ID
    const roleRecord = await prisma.accountRole.findFirst({ where: { name: role } });
    const roleId = roleRecord ? roleRecord.id : (await prisma.accountRole.create({ data: { name: role } })).id;

    // Transaction: create/update account + role-specific record
    const account = await prisma.$transaction(async (tx) => {
      let account;

      if (isOAuth && existingUser) {
        account = await tx.account.update({
          where: { id: existingUser.id },
          data: {
            role: roleId,
            username: role === "student" ? (validatedData.data as StudentData).name : (validatedData.data as CompanyData).companyName,
          }
        });
      } else {
        account = await tx.account.create({
          data: {
            email: validatedData.data.email,
            password: hashedPassword,
            role: roleId,
            username: role === "student" ? (validatedData.data as StudentData).name : (validatedData.data as CompanyData).companyName,
          }
        });
      }

      if (role === "student") {
        const studentData = validatedData.data as StudentData | StudentOAuthData;
        const isAlumni = studentData.studentStatus === "ALUMNI";

        await tx.student.create({
          data: {
            account_id: account.id,
            student_id: studentData.studentId,
            name: studentData.name,
            faculty: studentData.faculty,
            year: studentData.year.toString(),
            phone: studentData.phone,
            transcript: null,
            student_status: isAlumni ? "ALUMNI" : "CURRENT",
            verification_status: isAlumni ? "PENDING" : "APPROVED",
            email_verified: isOAuth && !isAlumni ? true : false,
            updated_at: new Date(),
          }
        });
      } else {
        const companyData = validatedData.data as CompanyData | CompanyOAuthData;
        const sanitizedDescription = sanitizeHtml(companyData.description ?? "", { allowedTags: [], allowedAttributes: {} });

        await tx.company.create({
          data: {
            account_id: account.id,
            name: companyData.companyName,
            address: companyData.address,
            phone: companyData.phone,
            description: sanitizedDescription,
            website: companyData.website || null,
            register_day: new Date(),
            registration_status: "PENDING",
          }
        });
      }

      return account;
    }, { maxWait: 5000, timeout: 10000 });

    // Handle file uploads
    if (transcriptFile && transcriptFile.size > 0) {
      try {
        const { uploadDocument } = await import("@/lib/uploadDocument");
        const document = await uploadDocument(transcriptFile, String(account.id), 4);
        await prisma.student.update({ where: { account_id: account.id }, data: { transcript: document.file_path } });
      } catch (error) {
        console.error("Error uploading transcript file:", error);
      }
    }

    if (evidenceFile && evidenceFile.size > 0) {
      try {
        const { uploadDocument } = await import("@/lib/uploadDocument");
        await uploadDocument(evidenceFile, String(account.id), 7);
      } catch (error) {
        console.error("Error uploading evidence file:", error);
      }
    }

    // Notify admins / send emails
    if (role === "student") {
      const studentData = validatedData.data as StudentData;
      const isAlumni = studentData.studentStatus === "ALUMNI";

      if (isAlumni) {
        try {
          const { sendAlumniRegistrationEmail } = await import("@/lib/email");
          await sendAlumniRegistrationEmail(validatedData.data.email, studentData.name);
        } catch (emailError) {
          console.error("❌ Failed to send registration email:", emailError);
        }
        try { await notifyAdminsNewAlumni(studentData.name, studentData.studentId, account.id); }
        catch (notificationError) { console.error("❌ Failed to notify admins:", notificationError); }
      }
    }

    if (role === "company") {
      try { await notifyAdminsNewCompany((validatedData.data as CompanyData).companyName, account.id); }
      catch (notificationError) { console.error("❌ Failed to notify admins:", notificationError); }
    }

    return NextResponse.json({ message: "Account created successfully", redirectTo: `/${role}/dashboard` }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error, error instanceof Error ? error.stack : '');
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 });

    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: { target?: string[] } };
      if (prismaError.code === 'P2002') return NextResponse.json({ error: "Registration failed due to duplicate data", details: `A record with this ${prismaError.meta?.target?.join(', ') || 'data'} already exists` }, { status: 409 });
      if (prismaError.code === 'P2003') return NextResponse.json({ error: "Registration failed", details: "Invalid reference data" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
