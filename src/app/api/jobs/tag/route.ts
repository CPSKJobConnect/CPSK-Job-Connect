import { prisma } from "@/lib/db";

export async function GET() {
  const jobTags = await prisma.jobTag.findMany({
    select: { id: true, name: true },
  });

  return new Response(JSON.stringify(jobTags), { status: 200 });
}