import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const target = searchParams.get("target"); // "JOB", "POST", "GENERAL"

    const reportTypes = await prisma.reportType.findMany({
      where: target ? { target } : undefined,
      select: { id: true, name: true, target: true },
    });

    return NextResponse.json(reportTypes);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch report types" }, { status: 500 });
  }
}
