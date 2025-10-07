import { prisma } from "@/lib/db";

export async function GET() {
  const jobTypes = await prisma.jobTag.findMany({
    select: { id: true, name: true },
  });

  return new Response(JSON.stringify(jobTypes), { status: 200 });
}