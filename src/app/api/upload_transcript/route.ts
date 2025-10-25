import { prisma } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function uploadDocument(file: File, userId: string, docTypeId: number) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

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

// Add a POST route handler to satisfy Next.js route requirements
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const docTypeId = formData.get('docTypeId') as string;

    if (!file || !userId || !docTypeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const document = await uploadDocument(file, userId, Number(docTypeId));
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}