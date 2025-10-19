import { writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file) {
      return NextResponse.json(
        {error: "No file uploaded"},
        {status: 400}
      )
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public/uploads/transcripts")
    const filename = `${userId}_${Date.now()}_${file.name}`
    const filepath = path.join(uploadDir, filename)

    await writeFile(filepath, buffer)

    return NextResponse.json({
      message: "File uploaded successfully",
      filename,
      path: `/uploads/transcripts/${filename}`,
    })

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )
  }
}