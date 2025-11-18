import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const types = await prisma.reportType.findMany();
    return NextResponse.json(types);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch report types" }, { status: 500 });
  }
}
