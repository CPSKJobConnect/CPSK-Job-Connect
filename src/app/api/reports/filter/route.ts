import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TARGETS = ["JOB", "POST", "GENERAL"] as const;

export async function GET(req: NextRequest) {
  try {
    const targetParam = req.nextUrl.searchParams.get("target") || undefined;

    // Canonicalize and validate input (ASVS 1.1.1)
    let target: typeof ALLOWED_TARGETS[number] | undefined;
    if (targetParam) {
      if ((ALLOWED_TARGETS as readonly string[]).includes(targetParam)) {
        target = targetParam as typeof ALLOWED_TARGETS[number];
      } else {
        return NextResponse.json(
          { error: "Invalid target parameter" },
          { status: 400 }
        );
      }
    }

    const reportTypes = await prisma.reportType.findMany({
      where: target ? { target } : undefined,
      select: { id: true, name: true, target: true },
    });

    return NextResponse.json(reportTypes);
  } catch (err) {
    console.error("Error fetching report types:", err);
    return NextResponse.json(
      { error: "Failed to fetch report types" },
      { status: 500 }
    );
  }
}
