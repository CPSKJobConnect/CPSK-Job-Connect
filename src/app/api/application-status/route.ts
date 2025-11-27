import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import DOMPurify from "isomorphic-dompurify";

export async function GET() {
  try {
    const statuses = await prisma.applicationStatus.findMany();

    // Sanitize all status names to prevent XSS from DB input
    const sanitizedStatuses = statuses.map((statusRecord) => ({
      ...statusRecord,
      name: DOMPurify.sanitize(statusRecord.name),
    }));

    return NextResponse.json({ statuses: sanitizedStatuses });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to fetch statuses:", error);
    }
    return NextResponse.json({ error: "Failed to fetch statuses" }, { status: 500 });
  }
}
