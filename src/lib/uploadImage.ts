import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/db";

/**
 * Upload an image file to Supabase storage and return a signed URL
 * @param file - The image file to upload
 * @param accountId - The account ID for organizing files
 * @param type - Type of image: "logo" or "background"
 * @returns A signed URL of the uploaded image (valid for 1 year)
 */
export async function uploadImage(
  file: File,
  accountId: string,
  type: "logo" | "background"
): Promise<string> {
  // Ensure server-side execution
  if (typeof window !== "undefined") {
    throw new Error("uploadImage should only be called server-side");
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const timestamp = Date.now();
  const filePath = `profile-images/${accountId}/${type}_${timestamp}_${file.name}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Supabase storage error:", error);
    }
    throw new Error("Failed to upload image"); // generic error for production
  }

  // Generate signed URL (1 year)
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from("documents")
    .createSignedUrl(data.path, 31536000);

  if (signedUrlError) {
    if (process.env.NODE_ENV === "development") {
      console.error("Supabase signed URL error:", signedUrlError);
    }
    throw new Error("Failed to generate image URL"); // generic error for production
  }

  return signedUrlData.signedUrl;
}
