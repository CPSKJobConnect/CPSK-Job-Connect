import { prisma } from "@/lib/db";

export async function fetchJobPost(params: { id: string }) {
  const jobPost = await prisma.jobPost.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      company: {
        include: {
          account: {
            select: {
              email: true
            }
          }
        }
      },
      jobType: true,
      jobArrangement: true,
      categories: true,
      tags: true,
      applications: {
        include: {
          student: {
            include: {
              account: {
                select: {
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });
  return jobPost;
}