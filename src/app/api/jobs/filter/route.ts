import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

const salaryRanges = Array.from({ length: 9 }, (_, i) => (10000 + i * 5000).toString());

export async function GET(req: Request) {
  try {

    const categories = await prisma.jobCategory.findMany({
      select: { name: true }
    });

    const types = await prisma.jobType.findMany({
      select: { name: true }
    });

    const arrangements = await prisma.jobArrangement.findMany({
      select: { name: true }
    });

    const tags = await prisma.jobTag.findMany({
      select: { name: true }
    });

    return NextResponse.json({
      categories: categories.map((c) => c.name),
      types: types.map((t) => t.name),
      arrangements: arrangements.map((a) => a.name),
      salaryRanges,
      tags: tags.map((t) => t.name),
    });
  } catch (error) {
    console.error("Error fetching job filters:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}