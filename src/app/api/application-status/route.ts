import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const statuses = await prisma.applicationStatus.findMany();
    return NextResponse.json({ statuses });
  } catch (error) {
    console.error("Failed to fetch statuses:", error);
    return NextResponse.json({ error: "Failed to fetch statuses" }, { status: 500 });
  }
}
