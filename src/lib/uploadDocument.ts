import { prisma } from "@/lib/db";
import { getPolicyForDocType, validateFileAgainstPolicy } from "@/lib/filePolicy";
import { createClient } from "@supabase/supabase-js";

let cachedSupabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!cachedSupabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Supabase configuration is missing.");
    }
    cachedSupabaseClient = createClient(url, key);
  }
  return cachedSupabaseClient;
}

const DOC_SUFFIXES: Record<number, string> = {
  1: "resume",
  2: "cv",
  3: "portfolio",
  4: "transcript",
  5: "company_evidence",
  6: "profile_background",
  7: "company_evidence",
};

const getSuffix = (docTypeId: number) => DOC_SUFFIXES[docTypeId] ?? "document";

export async function uploadDocument(file: File, accountId: string, docTypeId: number) {
  const policy = getPolicyForDocType(docTypeId);
  const { sanitizedFileName } = await validateFileAgainstPolicy(file, policy);

  const supabase = getSupabaseClient();
  const filePath = `${accountId}/${Date.now()}_${getSuffix(docTypeId)}_${sanitizedFileName}`;
  const { data, error } = await supabase.storage
    .from("documents")
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type || policy.allowedMimeTypes[0],
    });

  if (error) {
    console.error("Supabase storage error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const document = await prisma.document.create({
    data: {
      account_id: Number(accountId),
      doc_type_id: docTypeId,
      file_name: sanitizedFileName,
      file_path: data.path,
    },
  });

  return document;
}
