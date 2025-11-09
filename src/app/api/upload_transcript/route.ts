import { prisma } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * Utility function to upload a document to Supabase Storage and create a database record
 * @param file - The file to upload
 * @param userId - The user's account ID
 * @param docTypeId - The document type ID
 * @returns The created document record
 */
export async function uploadDocument(file: File, userId: string, docTypeId: number) {
  // Use service role key to bypass RLS policies
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const filePath = `Document/${userId}/${Date.now()}_${file.name}`;
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

/**
 * POST /api/upload_transcript
 * Upload a transcript document for a student
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const docTypeId = formData.get('docTypeId') as string;

    // Validate required fields
    if (!file || !userId || !docTypeId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, userId, or docTypeId' },
        { status: 400 }
      );
    }

    // Upload document using the utility function
    const document = await uploadDocument(file, userId, parseInt(docTypeId));

    return NextResponse.json(
      { success: true, document },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload transcript error:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: 'Failed to upload transcript', details: errorMessage },
      { status: 500 }
    );
  }
}