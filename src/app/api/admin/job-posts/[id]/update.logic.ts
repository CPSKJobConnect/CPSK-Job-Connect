import { prisma } from "@/lib/db";
import DOMPurify from "isomorphic-dompurify";

export async function updateJobPost(params: { id: string }, data: any) {
  const jobPostId = Number(params.id);
  if (isNaN(jobPostId)) throw new Error("Invalid job post ID");

  const {
    jobName,
    location,
    aboutRole,
    requirements,
    qualifications,
    minSalary,
    maxSalary,
    deadline,
    isPublished,
    jobTypeId,
    jobArrangementId,
    categoryIds,
    tagIds
  } = data;

  // --- Sanitize HTML input ---
  const safeAboutRole = aboutRole ? DOMPurify.sanitize(aboutRole) : undefined;

  // --- Convert requirements and qualifications to string[] and sanitize each ---
  const safeRequirements: string[] | undefined = requirements
    ? requirements.split(/\r?\n/).map((line: string) => DOMPurify.sanitize(line)).filter(Boolean)
    : undefined;

  const safeQualifications: string[] | undefined = qualifications
    ? qualifications.split(/\r?\n/).map((line: string) => DOMPurify.sanitize(line)).filter(Boolean)
    : undefined;

  // --- Disconnect existing tags first ---
  if (tagIds && tagIds.length > 0) {
    await prisma.jobPost.update({
      where: { id: jobPostId },
      data: { tags: { set: [] } }
    });
  }

  // --- Update job post ---
  const jobPost = await prisma.jobPost.update({
    where: { id: jobPostId },
    data: {
      jobName,
      location,
      aboutRole: safeAboutRole,
      requirements: safeRequirements,
      qualifications: safeQualifications,
      min_salary: minSalary,
      max_salary: maxSalary,
      deadline: deadline ? new Date(deadline) : undefined,
      is_Published: isPublished,
      job_arrangement_id: jobArrangementId,
      job_type_id: jobTypeId,
      job_category_id: categoryIds && categoryIds.length > 0 ? categoryIds[0] : undefined,
      tags: tagIds && tagIds.length > 0 ? { connect: tagIds.map((id: number) => ({ id })) } : undefined
    },
    include: {
      company: true,
      jobType: true,
      jobArrangement: true,
      category: true,
      tags: true
    }
  });

  return jobPost;
}
