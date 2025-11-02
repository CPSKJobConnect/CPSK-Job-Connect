import { prisma } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

export async function uploadDocument(file: File, accountId: string, docTypeId: number) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let suffix = "file";
  if (docTypeId === 1) suffix = "resume";
  else if (docTypeId === 2) suffix = "cv";
  else if (docTypeId === 3) suffix = "portfolio";
  else if (docTypeId === 4) suffix = "transcript";
  else if (docTypeId === 5) suffix = "company_evidence";

  const filePath = `${accountId}/${Date.now()}_${suffix}_${file.name}`;
  const { data, error } = await supabase.storage
    .from("documents")
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type
    });

  if (error) {
    console.error("Supabase storage error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const document = await prisma.document.create({
    data: {
      account_id: Number(accountId),
      doc_type_id: docTypeId,
      file_name: file.name,
      file_path: data.path,
    },
  });

  return document;
}