import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const { studentId, jobId } = await req.json();

  if (!studentId || !jobId) {
    return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
  }

  const existingApplication = await prisma.application.findFirst({
    where: {
      student_id: Number(studentId),
      job_post_id: Number(jobId),
    },
  });

  return new Response(
    JSON.stringify({ applied: !!existingApplication }),
    { status: 200 }
  );
}