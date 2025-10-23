import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

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

    if (error) throw error;

    const document = await prisma.document.create({
      data: {
        account_id: Number(userId),
        doc_type_id: docTypeId,
        file_name: file.name,
        file_path: data.path,
      },
    });

    return NextResponse.json(document);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
