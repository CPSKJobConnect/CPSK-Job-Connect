import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.account.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    // Delete old profile image if it exists
    const oldAccount = await prisma.account.findUnique({
      where: { id: account.id },
      select: { logoUrl: true }
    });

    if (oldAccount?.logoUrl) {
      try {
        await supabase.storage.from("documents").remove([oldAccount.logoUrl]);
      } catch (error) {
        console.error("Failed to delete old profile image:", error);
        // Continue even if deletion fails
      }
    }

    // Upload new profile image
    const timestamp = Date.now();
    const filePath = `profile-images/${account.id}/${timestamp}_${file.name}`;

    const { data, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get signed URL (valid for 1 year)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("documents")
      .createSignedUrl(data.path, 31536000); // 1 year in seconds

    if (signedUrlError) {
      throw new Error(`Failed to generate signed URL: ${signedUrlError.message}`);
    }

    // Update account with new profile image URL
    await prisma.account.update({
      where: { id: account.id },
      data: { logoUrl: signedUrlData.signedUrl }
    });

    return NextResponse.json({
      success: true,
      profile_url: signedUrlData.signedUrl
    });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return NextResponse.json({ error: "Failed to upload profile image" }, { status: 500 });
  }
}
