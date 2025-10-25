import { prisma } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

export async function uploadDocument(file: File, userId: string, docTypeId: number) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

  let suffix = "file";
  if (docTypeId === 1) suffix = "resume";
  else if (docTypeId === 2) suffix = "cv";
  else if (docTypeId === 3) suffix = "portfolio";
  else if (docTypeId === 4) suffix = "transcript";
  else if (docTypeId === 5) suffix = "company_evidence";

  const filePath = `${userId}/${Date.now()}_${suffix}_${file.name}`;
  const { data, error } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (error) throw error;

  const document = await prisma.document.create({
    data: {
      account_id: Number(userId),
      doc_type_id: docTypeId,
      file_name: file.name,
      file_path: data.path,
    },
  });

  return document;
}