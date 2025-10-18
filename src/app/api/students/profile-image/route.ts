import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type (accept only images)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Get account
    const account = await prisma.account.findUnique({
      where: { email: session.user.email },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Upload to Supabase storage
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const filePath = `profile-images/${account.id}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get signed URL (valid for 1 year)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("documents")
      .createSignedUrl(data.path, 31536000); // 1 year in seconds

    if (signedUrlError) {
      console.error("Supabase signed URL error:", signedUrlError);
      return NextResponse.json(
        { error: "Failed to generate image URL" },
        { status: 500 }
      );
    }

    // Update account with new logoUrl
    const updatedAccount = await prisma.account.update({
      where: { id: account.id },
      data: {
        logoUrl: signedUrlData.signedUrl,
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
    return NextResponse.json(
      { error: "Failed to update profile image" },
      { status: 500 }
    );
  }
}
