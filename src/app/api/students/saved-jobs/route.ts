import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { account_id: parseInt(session.user.id) },
    });
    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }
    // Create a new saved job entry
    const savedJob = await prisma.savedJob.create({
      data: {
        student_id: student.id,
        job_post_id: Number(jobId),
      },
    });
    // const jobPost = await prisma.jobPost.findUnique({
    //   where: { id: Number(jobId) },
    //   select: { jobName: true },
    // });
    // After successfully saving the job
    // console.log(`Saved job: ${jobPost?.jobName}`);  
    
    return NextResponse.json(
      {savedJob, message: "Job saved successfully"},
      { status: 201 }
    );
    // https://www.prisma.io/docs/reference/api-reference/error-reference
  } catch (error: unknown) {
    // P2002 = Unique constraint failed (There is already a record of this savedJob that has the same student_id and job_post_id)
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        {error: "Job already saved" },
        { status: 400 }
      );
    }
    // other errors
    console.error("Error saving job:", error);
    return NextResponse.json(
      { error: "Internal Server Error, Failed to save job to bookmark" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
  }

  const { jobId } = await request.json();

  if (!jobId) {
    return NextResponse.json(
      { error: "Job ID is required, bad request" },
      { status: 400 }
    );
  }

  const student = await prisma.student.findUnique({
    where: { account_id: parseInt(session.user.id) },
  });
  // 404 not found: server can't find the source
  if (!student) {
    return NextResponse.json(
      { error: "Student profile not found" },
      { status: 404 }
    );
  }
  // We delete the saved job entry, if it exists. If not we will catch the prisma error. This reduces one database call.
  await prisma.savedJob.delete({
    where: {
      student_id_job_post_id: {
        student_id: student.id,
        job_post_id: Number(jobId),
      }
    },
    select: { id: true ,
      student_id: true,
      job_post_id: true,
      jobPost: {
        select: {
          jobName: true,
        }
      }
    }
  });
  // console.log(`Unsaved job: ${deletedJob.jobPost.jobName} for student: ${student.id}`);
  // After successfully removing the saved job
  return NextResponse.json(
    { message: "Job unsaved successfully" },
    { status: 200 }
  );

    

} catch (error: unknown) {
    // the job record to be deleted does not exist
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json(
        {error: "Job was not saved/bookmarked." },
        { status: 404 }
      );
    }
    console.error("Error unsaving job:", error);
    return NextResponse.json(
      { error: "Internal Server Error, Failed to unsave job from bookmark" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    const jobId = request.nextUrl.searchParams.get("jobId");

    const student = await prisma.student.findUnique({
      where: { account_id: parseInt(session.user.id) },
    });
    if (!student){
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Check if specific job is saved

    // If jobId is provided, just return boolean.
    if (jobId) {
      const savedJob = await prisma.savedJob.findUnique({
        where: {
          student_id_job_post_id: {
            student_id: student.id,
            job_post_id: Number(jobId),
          },
        },  
    });
    // Convert query result to boolean: if null/undefined -> false, else object exists -> true
    return NextResponse.json(
      { isSaved: !!savedJob },
      { status: 200 }
    );
    }
    // If jobId is not provided, return all saved jobs and full details for the student
    const savedJobs = await prisma.savedJob.findMany({
      where: { student_id: student.id },
      include: {
        jobPost: {
          include: {
            company: {
              include: {
                account: true // company name and logo
              }
            },
            jobType: true,
            jobArrangement: true,
            categories: true,
            tags: true,
            applications: {
              where: { student_id: student.id },
              select: { id: true }
            },
            _count: {
              select: { applications: true }
            }
          }
        }
      },
      orderBy: {
        created_at: "desc" // most recently saved first
      }
    });

    // Transform data to match BookmarkJobInfo format for frontend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedJobs = savedJobs.map((savedJob: any) => ({
      job: {
        id: String(savedJob.jobPost.id),
        companyLogo: savedJob.jobPost.company.account.logoUrl || "/default-logo.png",
        companyBg: savedJob.jobPost.company.account.backgroundUrl || "/default-bg.png",
        title: savedJob.jobPost.jobName,
        companyName: savedJob.jobPost.company.name,
        category: savedJob.jobPost.categories[0]?.name || "General",
        location: savedJob.jobPost.location,
        posted: savedJob.jobPost.created_at.toISOString(),
        applied: savedJob.jobPost._count.applications,
        salary: {
          min: savedJob.jobPost.min_salary,
          max: savedJob.jobPost.max_salary
        },
        skills: savedJob.jobPost.tags.map((tag: { name: string }) => tag.name),
        description: {
          overview: savedJob.jobPost.aboutRole,
          responsibility: savedJob.jobPost.aboutRole,
          requirement: savedJob.jobPost.requirements.join("\n"),
          qualification: savedJob.jobPost.qualifications.join("\n")
        },
        type: savedJob.jobPost.jobType.name.toLowerCase(),
        arrangement: savedJob.jobPost.jobArrangement.name.toLowerCase(),
        deadline: savedJob.jobPost.deadline.toISOString(),
        status: savedJob.jobPost.deadline < new Date() ? "expire" : "active",
        isSaved: true
      },
      added_at: savedJob.created_at.toISOString(),
      isBookmarked: true,
      isApplied: savedJob.jobPost.applications.length > 0
    }));

      return NextResponse.json(
        { savedJobs: transformedJobs },
        { status: 200 }
      );

  } catch (error) {
    console.error("Error fetching saved jobs:", error);
    return NextResponse.json(
      { error: "Internal Server Error, Failed to fetch saved jobs" },
      { status: 500 }
    );
  }
}