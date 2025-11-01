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
        {error: "Invalid role"},
        {status:400}
      )
    }

    // Convert FormData to object
    const data: Record<string, unknown> = {}
    for (const [key, value] of formData.entries()) {
      if (key !== "transcript" && key !== "role") {
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

    // Handle file upload for transcript
    let transcriptPath: string | null = null
    if (role === "student") {
      const transcriptFile = formData.get("transcript") as File;
      if (transcriptFile && transcriptFile.size > 0) {
        // File upload on cloud AWS S3, Cloudinary
        // Generate path with temporary ID - will be updated with actual account ID in transaction
        transcriptPath = `transcripts/temp_${transcriptFile.name}`;
        // TODO: file upload logic
      }
    }

    // Use transaction to ensure atomic account + role-specific record creation
    await prisma.$transaction(async (tx) => {
      // Create account
      const account = await tx.account.create({
        data: {
          email: validatedData.data.email,
          password: hashedPassword,
          role: roleId,
          username: role === "student" ? (validatedData.data as StudentData).name : (validatedData.data as CompanyData).companyName,
        }
      })

      // Update transcript path with actual account ID if needed
      if (transcriptPath) {
        transcriptPath = `transcripts/${account.id}_${(formData.get("transcript") as File).name}`;
      }

      // Create role-specific record
      if (role === "student") {
        await tx.student.create({
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