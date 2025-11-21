import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/uploadImage";
import { FileValidationError } from "@/lib/filePolicy";

export async function POST(request: NextRequest) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { id: parseInt(session.user.id) },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Upload and obtain signed URL via shared helper
    const signedUrl = await uploadImage(file, String(account.id), "logo");

    // Update account with new logoUrl
    const updatedAccount = await prisma.account.update({
      where: { id: account.id },
      data: {
        logoUrl: signedUrl,
      },
    });

    return NextResponse.json(
      {
        message: "Profile image updated successfully",
        profile_url: updatedAccount.logoUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API error:", error);
    if (error instanceof FileValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update profile image" },
      { status: 500 }
    );
  }
}
