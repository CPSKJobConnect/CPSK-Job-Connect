import { prisma } from "@/lib/db";

export async function updateJobPost(params: { id: string }, data: any) {
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

  // First, disconnect existing categories and tags
  await prisma.jobPost.update({
    where: { id: parseInt(params.id) },
    data: {
      categories: {
        set: []
      },
      tags: {
        set: []
      }
    }
  });

  const jobPost = await prisma.jobPost.update({
    where: { id: parseInt(params.id) },
    data: {
      jobName,
      location,
      aboutRole,
      requirements,
      qualifications,
      min_salary: minSalary,
      max_salary: maxSalary,
      deadline: new Date(deadline),
      is_Published: isPublished,
      job_arrangement_id: jobArrangementId,
      job_type_id: jobTypeId,
      categories: {
        connect: categoryIds.map((id: number) => ({ id }))
      },
      tags: {
        connect: tagIds.map((id: number) => ({ id }))
      }
    },
    include: {
      company: true,
      jobType: true,
      jobArrangement: true,
      categories: true,
      tags: true
    }
  });
  return jobPost;
}