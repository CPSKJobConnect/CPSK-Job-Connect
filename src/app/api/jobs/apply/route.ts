import { uploadDocument } from "@/lib/uploadDocument";
import {prisma} from "@/lib/db";

export async function POST(req: Request) {
  const formData = await req.formData();
  const userId = formData.get("userId") as string;
  const jobId = Number(formData.get("jobId"));

  const resumeFile = formData.get("resume") as File | null;
  const resumeId = formData.get("resumeId") as string | null;

  const portfolioFile = formData.get("portfolio") as File | null;
  const portfolioId = formData.get("portfolioId") as string | null;

  let resumeDoc, portfolioDoc;

  if (resumeFile) {
    resumeDoc = await uploadDocument(resumeFile, userId, 1);
  } else if (resumeId) {
    resumeDoc = { id: Number(resumeId) };
  }

  if (portfolioFile) {
    portfolioDoc = await uploadDocument(portfolioFile, userId, 3);
  } else if (portfolioId) {
    portfolioDoc = { id: Number(portfolioId) };
  }

  const student = await prisma.student.findUnique({
    where: { account_id: Number(userId) }
    });
    if (!student) throw new Error("Student not found");

  const application = await prisma.application.create({
    data: {
      student_id: student.id,
      job_post_id: jobId,
      status: 1,
      resume_id: resumeDoc?.id,
      portfolio_id: portfolioDoc?.id,
    },
  });

  return new Response(JSON.stringify({ application }), { status: 200 });
}
