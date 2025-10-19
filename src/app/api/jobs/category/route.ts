import { prisma } from "@/lib/db";

export async function GET() {
  const jobCategories = await prisma.jobCategory.findMany({
    select: { id: true, name: true },
  });

  return new Response(JSON.stringify(jobCategories), { status: 200 });
}