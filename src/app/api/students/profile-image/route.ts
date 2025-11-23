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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { id: parseInt(session.user.id) },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Attempt to remove existing logo file if present before uploading
    const existing = await prisma.account.findUnique({ where: { id: account.id }, select: { logoUrl: true } });
    try {
      if (existing?.logoUrl) {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        await supabase.storage.from("documents").remove([existing.logoUrl]);
      }
    } catch (err) {
      console.error("Failed to remove old student profile image:", err);
    }

    // Upload and obtain signed URL via shared helper
    let signedUrl: string;
    try {
      signedUrl = await uploadImage(file, String(account.id), "logo");
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Failed to upload image")) {
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
      }
      if (err instanceof Error && err.message.startsWith("Failed to generate image URL")) {
        return NextResponse.json({ error: "Failed to generate image URL" }, { status: 500 });
      }
      throw err;
    }

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
