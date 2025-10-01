import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const jobs = await prisma.jobPost.findMany({
      include: {
        types: true,
        arrangements: true,
        categories: true,
        tags: true,
      },
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}