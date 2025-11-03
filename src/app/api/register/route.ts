import { prisma } from "@/lib/db";
import { companyRegisterSchema, studentRegisterSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type StudentData = z.infer<typeof studentRegisterSchema>;
type CompanyData = z.infer<typeof companyRegisterSchema>;

export async function POST(req: NextRequest) {
  try {
    console.log("Registration API called");
    const formData = await req.formData();
    // console.log("FormData received, entries:", Array.from(formData.entries()));
    const role = formData.get("role") as string;
    // console.log("Role:", role);
    if (!["student", "company"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      )
    }

    // Convert FormData to object
    const data: Record<string, unknown> = {}
    for (const [key, value] of formData.entries()) {
      if (key !== "transcript" && key !== "evidence" && key !== "role") {
        if (key === "year") {
          // Handle both numeric years and "Alumni"
          const yearValue = value as string;
          data[key] = yearValue === "Alumni" ? "Alumni" : parseInt(yearValue);
        } else {
          data[key] = value
        }
      }
    }

    // Handle studentStatus from form
    const studentStatus = formData.get("studentStatus") as string | null;
    if (studentStatus) {
      data.studentStatus = studentStatus;
    }

    // Add transcript file to data for validation
    if (role === "student") {
      const transcriptFile = formData.get("transcript") as File | null;
      if (transcriptFile && transcriptFile.size > 0) {
        data.transcript = transcriptFile;
      }
    }
    // Validate data base on role
    // console.log("Data to validate:", data);
    let validatedData: z.ZodSafeParseResult<StudentData | CompanyData>;
    if (role === "student") {
      // safe parse throws errors instead of crashing the server
      validatedData = studentRegisterSchema.safeParse(data);
      // console.log("Student validation result:", validatedData);
    } else {
      validatedData = companyRegisterSchema.safeParse(data);
      // console.log("Company validation result:", validatedData);
    }

    if (!validatedData.success) {
      // console.log("Validation failed:", validatedData.error.issues);
      return NextResponse.json(
        { error: "Invalid data", details: validatedData.error.issues },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.account.findUnique({
      where: {
        email: validatedData.data.email,
      },
      include: {
        student: true,
        company: true,
      }
    })

    // If account exists and has complete registration
    if (existingUser && (existingUser.student || existingUser.company)) {
      return NextResponse.json( 
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // If account exists but is orphaned (no student/company record), clean it up
    if (existingUser) {
      console.log("Found orphaned account, cleaning up:", existingUser.id);
      await prisma.account.delete({
        where: { id: existingUser.id }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.data.password, 12);

    // Get role ID
    const roleRecord = await prisma.accountRole.findFirst({
      where: {
        name: role
      }
    })
    let roleId: number;
    if (!roleRecord) {
      // Create role if it doesn't exist
      const newRole = await prisma.accountRole.create({
        data: {
          name: role
        }
      })
      roleId = newRole.id;
    } else {
      roleId = roleRecord.id;
    }

    // Handle file upload for transcript and evidence
    let transcriptPath: string | null = null
    const transcriptFile = role === "student" ? formData.get("transcript") as File : null;
    const evidenceFile = role === "company" ? formData.get("evidence") as File : null;

    // Use transaction to ensure atomic account + role-specific record creation
    const account = await prisma.$transaction(async (tx) => {
      // Create account
      const account = await tx.account.create({
        data: {
          email: validatedData.data.email,
          password: hashedPassword,
          role: roleId,
          username: role === "student" ? (validatedData.data as StudentData).name : (validatedData.data as CompanyData).companyName,
        }
      })

      // Create role-specific record (without file paths initially)
      if (role === "student") {
        const studentData = validatedData.data as StudentData;
        const isAlumni = studentData.studentStatus === "ALUMNI";

        await tx.student.create({
          data: {
            account_id: account.id,
            student_id: studentData.studentId,
            name: studentData.name,
            faculty: studentData.faculty,
            year: studentData.year.toString(),
            phone: studentData.phone,
            transcript: null, // Will be updated after file upload
            student_status: isAlumni ? "ALUMNI" : "CURRENT",
            // Alumni need admin approval, current students just need email verification
            verification_status: isAlumni ? "PENDING" : "APPROVED",
            email_verified: false,
          }
        })
      } else {
        await tx.company.create({
          data: {
            account_id: account.id,
            name: (validatedData.data as CompanyData).companyName,
            address: (validatedData.data as CompanyData).address,
            // year: (validatedData.data as CompanyData).year, // Removed from schema
            phone: (validatedData.data as CompanyData).phone,
            description: (validatedData.data as CompanyData).description,
            website: (validatedData.data as CompanyData).website || null,
            register_day: new Date(),
            registration_status: "pending",
          }
        })
      }

      return account;
    }, {
      maxWait: 5000, // Maximum time to wait for a transaction slot (ms)
      timeout: 10000, // Maximum time the transaction can run (ms)
    })

    // Handle file uploads AFTER transaction completes
    if (transcriptFile && transcriptFile.size > 0) {
      try {
        const { uploadDocument } = await import("@/lib/uploadDocument");
        const document = await uploadDocument(transcriptFile, String(account.id), 4); // 4 = Transcript
        transcriptPath = document.file_path;

        // Update student record with transcript path
        await prisma.student.update({
          where: { account_id: account.id },
          data: { transcript: transcriptPath }
        });
      } catch (error) {
        console.error("Error uploading transcript file:", error);
        // Continue with registration even if file upload fails
      }
    }

    // Send registration confirmation email to alumni
    if (role === "student") {
      const studentData = validatedData.data as StudentData;
      const isAlumni = studentData.studentStatus === "ALUMNI";

      if (isAlumni) {
        try {
          const { sendAlumniRegistrationEmail } = await import("@/lib/email");
          await sendAlumniRegistrationEmail(
            validatedData.data.email,
            studentData.name
          );
          console.log(`✅ Registration confirmation email sent to ${validatedData.data.email}`);
        } catch (emailError) {
          console.error(`❌ Failed to send registration email to ${validatedData.data.email}:`, emailError);
          // Continue with registration even if email fails
        }
      }
    }

    if (evidenceFile && evidenceFile.size > 0) {
      try {
        const { uploadDocument } = await import("@/lib/uploadDocument");
        await uploadDocument(evidenceFile, String(account.id), 7); // 7 = Company Evidence
        // Evidence is stored in Document table, no need to update Company record
      } catch (error) {
        console.error("Error uploading evidence file:", error);
        // Continue with registration even if file upload fails
      }
    }

    return NextResponse.json({
      message: "Account created successfully",
      redirectTo: `/${role}/dashboard`
    }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace')

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    // Handle Prisma unique constraint errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: { target?: string[] } };

      if (prismaError.code === 'P2002') {
        const target = prismaError.meta?.target;
        console.error("Unique constraint violation on:", target);

        return NextResponse.json(
          {
            error: "Registration failed due to duplicate data",
            details: `A record with this ${target?.join(', ') || 'data'} already exists`
          },
          { status: 409 }
        );
      }

      if (prismaError.code === 'P2003') {
        return NextResponse.json(
          { error: "Registration failed", details: "Invalid reference data" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}