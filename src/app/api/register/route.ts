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
      }
    })
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
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

    // Create account
    const account = await prisma.account.create({
      data: {
        email: validatedData.data.email,
        password: hashedPassword,
        role: roleId,
        username: role === "student" ? (validatedData.data as StudentData).name : (validatedData.data as CompanyData).companyName,
      }
    })

    // Handle file upload for transcript and evidence
    let transcriptPath: string | null = null
    let evidencePath: string | null = null

    if (role === "student") {
      const transcriptFile = formData.get("transcript") as File;
      if (transcriptFile && transcriptFile.size > 0) {
        // File upload on cloud AWS S3, Cloudinary
        transcriptPath = `transcripts/${account.id}_${transcriptFile.name}`;
        // TODO: file upload logic
      }
    } else if (role === "company") {
      const evidenceFile = formData.get("evidence") as File;
      if (evidenceFile && evidenceFile.size > 0) {
        // Upload evidence file using the uploadDocument utility
        try {
          const { uploadDocument } = await import("@/lib/uploadDocument");
          const document = await uploadDocument(evidenceFile, String(account.id), 5); // 5 = Company Evidence
          evidencePath = document.file_path;
        } catch (error) {
          console.error("Error uploading evidence file:", error);
          // Continue with registration even if file upload fails
        }
      }
    }

    // Create role-specific record
    if (role === "student") {
      await prisma.student.create({
        data: {
          account_id: account.id,
          student_id: (validatedData.data as StudentData).studentId,
          name: (validatedData.data as StudentData).name,
          faculty: (validatedData.data as StudentData).faculty,
          year: (validatedData.data as StudentData).year.toString(),
          phone: (validatedData.data as StudentData).phone,
          transcript: transcriptPath,
        }
      })
    } else {
      await prisma.company.create({
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
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}