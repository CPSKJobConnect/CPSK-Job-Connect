import { prisma } from "@/lib/db";

export async function GET() {
  const jobArrangements = await prisma.jobArrangement.findMany({
    select: { id: true, name: true },
  });

  return new Response(JSON.stringify(jobArrangements), { status: 200 });
}