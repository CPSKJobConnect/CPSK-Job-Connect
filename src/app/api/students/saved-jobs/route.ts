import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";


export async function POST (req: Request) {
  // Checklist: 1. get user from session 2. get jobId from request body 3. validate jobId 4. check if saved job exists 5. if not exists, create it 6. if exists, return error 7. return appropriate response
  try {
    // Get authenticated user from session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }
    // get job id from request body
    const { jobId } = await req.json();
    // Validate that jobId is provided
    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }
    // Get the student from user email
    const student = await prisma.student.findFirst({
      where: {account: { email: session.user.email } },
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
    // After successfully saving the job
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

export async function DELETE (req: Request) {
  // Checklist: 1. get user from session 2. get jobId from request body 3. validate jobId 4. check if saved job exists 5. if exists, remove it 6. if not exists, return error 7. return appropriate response
  try { 
    // Get authenticated user from session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
  }

  // Parese jobId from request body
  const { jobId } = await req.json();
  // Validate that jobId is provided
  // 400 Bad Request
  if (!jobId) {
    return NextResponse.json(
      { error: "Job ID is required, bad request" },
      { status: 400 }
    );
  }
  // find the student from user email
  const student = await prisma.student.findFirst({
    where: {account: { email: session.user.email } },
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
    }
  });
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

// GET all saved jobs for the authenticated student
export async function GET (req: Request) {
  // jobId (optional): if provided, checks that the specific job post is saved by the student
  // Behavior: 1. If jobId is provided, return a boolean indicating if the job is saved 2. If jobId is not provided, return a list of all saved jobs for the student
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        {error: "Unauthorized - Please log in" },
        {status: 401 }
      )
    }
    // parse query parameters
    // /api/students/saved-jobs?jobId=123
    const {searchParams} = new URL(req.url);
    const jobId = searchParams.get("jobId");

    // find the student
    const student = await prisma.student.findFirst({
      where: { account: { email: session.user.email } },
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
      return NextResponse.json(
        { savedJobs },
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