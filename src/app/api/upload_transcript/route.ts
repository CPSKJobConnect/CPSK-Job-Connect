import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const docTypeId = Number(formData.get("doc_type_id") || 1); // default 1 if not provided

    if (!file || !userId) {
      return NextResponse.json({ error: "Missing file or userId" }, { status: 400 });
    }

    // Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Upload file to Supabase Storage
    const filePath = `uploads/${userId}_${Date.now()}_${file.name}`;
    const { data, error: uploadError } = await supabase.storage
      .from("transcripts")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Save metadata to Prisma
    const document = await prisma.document.create({
      data: {
        account_id: Number(userId),
        doc_type_id: docTypeId,
        file_name: file.name,
        file_path: data.path,
      },
    });

    return NextResponse.json({
      message: "File uploaded successfully",
      document,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: (error as any).message },
      { status: 500 }
    );
  }
}
