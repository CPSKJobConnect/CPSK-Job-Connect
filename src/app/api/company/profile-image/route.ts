import { getApiSession } from "@/lib/api-auth";
import { withResponseCsrfGuard } from '@/lib/csrfGuard';
import { prisma } from "@/lib/db";
import { FileValidationError } from "@/lib/filePolicy";
import { uploadImage } from "@/lib/uploadImage";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";


const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function POST_impl(request: NextRequest) {
  try {
    const session = await getApiSession(request);
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

    // Re-fetch account to obtain existing logoUrl so we can remove the old file
    const currentAccount = await prisma.account.findUnique({
      where: { id: account.id },
      select: { logoUrl: true }
    });

    try {
      if (currentAccount?.logoUrl) {
        await supabase.storage.from("documents").remove([currentAccount.logoUrl]);
      }
    } catch (removeErr) {
      // Log and continue; removal failure should not block the upload
      console.error("Failed to remove old profile image:", removeErr);
    }

    const signedUrl = await uploadImage(file, account.id.toString(), "logo");

    await prisma.account.update({
      where: { id: account.id },
      data: { logoUrl: signedUrl }
    });

    return NextResponse.json({
      success: true,
      profile_url: signedUrl
    });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    if (error instanceof FileValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to upload profile image" }, { status: 500 });
  }
}

export const POST = withResponseCsrfGuard(POST_impl as any);
