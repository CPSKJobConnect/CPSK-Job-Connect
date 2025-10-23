import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const docTypeId = Number(formData.get("docTypeId"));

    if (!file || !userId || !docTypeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

    const filePath = `Document/${userId}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

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
