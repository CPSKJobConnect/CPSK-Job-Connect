import { prisma } from "@/lib/db";
import createDOMPurify from "isomorphic-dompurify";

const DOMPurify = createDOMPurify();

export async function fetchJobPost(params: { id: string }) {
  const jobPostId = parseInt(decodeURIComponent(params.id));
  if (isNaN(jobPostId)) throw new Error("Invalid job post ID");

  const jobPost = await prisma.jobPost.findUnique({
    where: { id: jobPostId },
    include: {
      company: {
        include: {
          account: { select: { email: true } }
        }
      },
      jobType: true,
      jobArrangement: true,
      category: true,
      tags: true,
      applications: {
        include: {
          student: { include: { account: { select: { email: true } } } }
        }
      }
    }
  });

  if (!jobPost) return null;

  // --- Cast to any to access untyped fields ---
  const jobPostAny = jobPost as unknown as {
    description?: string;
    requirements?: string;
  };

  // --- Sanitize untrusted HTML fields ---
  if (jobPostAny.description) {
    jobPostAny.description = DOMPurify.sanitize(jobPostAny.description) as string;
  }
  if (jobPostAny.requirements) {
    jobPostAny.requirements = DOMPurify.sanitize(jobPostAny.requirements) as string;
  }

  return jobPostAny;
}
