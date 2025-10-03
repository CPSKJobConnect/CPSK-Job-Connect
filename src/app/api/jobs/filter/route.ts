import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

const salaryRanges = Array.from({ length: 9 }, (_, i) => (10000 + i * 5000).toString());

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.jobCategory.findMany({
      select: { name: true }
    });

    const types = await prisma.jobType.findMany({
      select: { name: true }
    });

    const arrangements = await prisma.jobArrangement.findMany({
      select: { name: true }
    });

    const locationsRaw = await prisma.jobPost.findMany({
      select: { location: true }
    });
    const locationsSet = new Set(locationsRaw.map((loc) => loc.location));
    const locations = Array.from(locationsSet);

    return NextResponse.json({
      categories: categories.map((c) => c.name),
      locations,
      types: types.map((t) => t.name),
      arrangements: arrangements.map((a) => a.name),
      salaryRanges,
    });
  } catch (error) {
    console.error("Error fetching job filters:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}