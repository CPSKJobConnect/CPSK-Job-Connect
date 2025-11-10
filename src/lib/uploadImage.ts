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
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create a unique file path matching student profile pattern
  const timestamp = Date.now();
  const filePath = `profile-images/${accountId}/${type}_${timestamp}_${file.name}`;

  // Upload to Supabase storage in the "documents" bucket
  const { data, error } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (error) {
    console.error("Supabase storage error:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get signed URL (valid for 1 year)
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from("documents")
    .createSignedUrl(data.path, 31536000); // 1 year in seconds

  if (signedUrlError) {
    console.error("Supabase signed URL error:", signedUrlError);
    throw new Error(`Failed to generate image URL: ${signedUrlError.message}`);
  }

  return signedUrlData.signedUrl;
}
