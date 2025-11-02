import { prisma } from "@/lib/db";

export async function deleteJobPost(params: { id: string }) {
  await prisma.jobPost.delete({
    where: { id: parseInt(params.id) }
  });
}