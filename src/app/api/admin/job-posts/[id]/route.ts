import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import DOMPurify from "dompurify"; // สำหรับ sanitize HTML
import { fetchJobPost } from "./fetch.logic";
import { updateJobPost } from "./update.logic";
import { deleteJobPost } from "./delete.logic";

interface SessionUser {
  email?: string;
  role?: string;
}

const logDebug = (...args: any[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(...args)
  }
}

// ฟังก์ชันตรวจสอบ Admin
function isAdmin(user: SessionUser | undefined) {
  return user?.role?.toLowerCase() === "admin";
}

// --- GET ---
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobPostId = parseInt(decodeURIComponent(id));
    if (isNaN(jobPostId)) {
      return NextResponse.json({ error: "Invalid job post ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user as SessionUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const jobPost = await fetchJobPost({ id: jobPostId.toString() });
    if (!jobPost) {
      return NextResponse.json({ error: "Job post not found" }, { status: 404 });
    }

    // Sanitize HTML fields
    if (jobPost.description) {
      jobPost.description = DOMPurify.sanitize(jobPost.description) as string;
    }
    if (jobPost.requirements) {
      jobPost.requirements = DOMPurify.sanitize(jobPost.requirements) as string;
    }

    return NextResponse.json(jobPost, { status: 200 });

  } catch (error) {
    logDebug("API error:", error);
    return NextResponse.json({ error: "Failed to fetch job post" }, { status: 500 });
  }
}

// --- PUT ---
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user as SessionUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const jobPostId = parseInt(decodeURIComponent(id));
    if (isNaN(jobPostId)) {
      return NextResponse.json({ error: "Invalid job post ID" }, { status: 400 });
    }

    const data = await request.json();

    // Sanitize any HTML fields coming from client
    if (data.description) data.description = DOMPurify.sanitize(data.description) as string;
    if (data.requirements) data.requirements = DOMPurify.sanitize(data.requirements) as string;

    const jobPost = await updateJobPost({ id: jobPostId.toString() }, data);

    if (!jobPost) {
      return NextResponse.json({ error: "Job post not found" }, { status: 404 });
    }

    return NextResponse.json(jobPost, { status: 200 });

  } catch (error) {
    logDebug("API error:", error);
    return NextResponse.json({ error: "Failed to update job post" }, { status: 500 });
  }
}

// --- DELETE ---
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user as SessionUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const jobPostId = parseInt(decodeURIComponent(id));
    if (isNaN(jobPostId)) {
      return NextResponse.json({ error: "Invalid job post ID" }, { status: 400 });
    }

    const deleted = await deleteJobPost({ id: jobPostId.toString() });

    return NextResponse.json({ message: "Successfully deleted", deleted }, { status: 200 });

  } catch (error) {
    logDebug("API error:", error);
    return NextResponse.json({ error: "Failed to delete job post" }, { status: 500 });
  }
}
