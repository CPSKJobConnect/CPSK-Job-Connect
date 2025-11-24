import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import sanitizeHtml from "sanitize-html";

const ALLOWED_TARGET_TYPES = ["JOB", "POST", "GENERAL"] as const;

const logDebug = (...args: any[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(...args)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getApiSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account_id = Number(session.user.id);
    const { target_type, target_id, report_type_id, description } = await req.json();

    // Canonicalization
    const canonicalTargetType = target_type?.trim().toUpperCase();
    const canonicalDescription = description?.trim();
    const canonicalReportTypeId = Number(report_type_id);

    // Validate target_type
    if (!canonicalTargetType || !ALLOWED_TARGET_TYPES.includes(canonicalTargetType as any)) {
      return NextResponse.json({ error: "Invalid target_type" }, { status: 400 });
    }

    if (target_id === undefined || target_id === null) {
      return NextResponse.json({ error: "target_id is required" }, { status: 400 });
    }

    // ตรวจสอบ report ซ้ำ
    let existingReport = null;
    if (Number(target_id) !== 0) {
      existingReport = await prisma.report.findFirst({
        where: {
          account_id,
          target_type: canonicalTargetType,
          target_id: Number(target_id),
        },
      });
      if (existingReport) {
        return NextResponse.json({ error: "You have already reported this item." }, { status: 400 });
      }
    }

    // Sanitize description
    const sanitizedDescription = canonicalDescription
      ? sanitizeHtml(canonicalDescription, { allowedTags: [], allowedAttributes: {} })
      : null;

    // สร้าง report
    const report = await prisma.report.create({
      data: {
        target_type: canonicalTargetType,
        target_id: Number(target_id),
        report_type_id: canonicalReportTypeId,
        description: sanitizedDescription,
        account_id,
      },
      include: {
        reportType: true,
        account: true,
      },
    });

    // กำหนด targetName สำหรับ notification
    let targetName = "";
    if (canonicalTargetType === "POST") {
      const post = await prisma.jobPost.findUnique({
        where: { id: Number(target_id) },
        select: { jobName: true },
      });
      targetName = post?.jobName || "";
    } else if (canonicalTargetType === "GENERAL") {
      targetName = "General Issue";
    }

    // สร้างข้อความ notification
    const message = `User "${report.account.username}" Reported "${targetName}"` +
      `${report.reportType ? `, Type: "${report.reportType.name}"` : ""}` +
      `${report.description ? `, Reason: "${report.description}"` : ""}`;

    await prisma.notification.create({
      data: {
        account_id: 27,
        message,
        sender_id: account_id,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    logDebug(err);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetTypeParam = searchParams.get("targetType");
    const reportTypeIdParam = searchParams.get("reportTypeId");
    const limit = Number(searchParams.get("limit") || 10);
    const sort = searchParams.get("sort");

    // Canonicalize inputs
    const canonicalTargetType = targetTypeParam?.trim().toUpperCase();
    const canonicalReportTypeId = reportTypeIdParam && reportTypeIdParam !== "all"
      ? Number(reportTypeIdParam)
      : undefined;

    // Validate targetType
    if (canonicalTargetType && !ALLOWED_TARGET_TYPES.includes(canonicalTargetType as any)) {
      return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
    }

    const where: any = {};
    if (canonicalTargetType) where.target_type = canonicalTargetType;
    if (canonicalReportTypeId !== undefined) where.report_type_id = canonicalReportTypeId;

    const orderBy: any = {};
    if (sort === "created_at") orderBy.created_at = "desc";
    else if (sort === "resolved") orderBy.is_resolved = "desc";

    let reports = await prisma.report.findMany({
      where,
      include: { account: true, reportType: true },
      orderBy,
      take: limit,
    });

    // เพิ่มข้อมูล jobPost
    const jobIds = reports
      .filter(r => r.target_type === "POST" && r.target_id !== null && r.target_id !== 0)
      .map(r => r.target_id as number);

    const jobsMap = new Map<number, any>();
    const applicationsMap = new Map<number, number>();

    if (jobIds.length > 0) {
      const jobs = await prisma.jobPost.findMany({
        where: { id: { in: jobIds } },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              address: true,
              account: { select: { logoUrl: true, backgroundUrl: true } },
            },
          },
          jobArrangement: { select: { id: true, name: true } },
          jobType: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          tags: { select: { id: true, name: true } },
        },
      });
      jobs.forEach(job => jobsMap.set(job.id, job));

      const applicationsCounts = await prisma.application.groupBy({
        by: ["job_post_id"],
        where: { job_post_id: { in: jobIds } },
        _count: { job_post_id: true },
      });
      applicationsCounts.forEach(c => applicationsMap.set(c.job_post_id, c._count.job_post_id));
    }

    reports = reports.map(r => {
      if (r.target_type === "POST" && r.target_id !== null && r.target_id !== 0) {
        const job = jobsMap.get(r.target_id) || null;
        if (job) job.applied = applicationsMap.get(r.target_id) || 0;
        return { ...r, jobPost: job };
      }
      return { ...r, jobPost: null };
    });

    // Sort by report_count if needed
    if (sort === "report_count" && canonicalTargetType === "POST") {
      const postCounts = await prisma.report.groupBy({
        by: ["target_id"],
        _count: { target_id: true },
        where: { target_type: "POST" },
      });
      const countMap = new Map(postCounts.map(p => [p.target_id, p._count.target_id]));
      reports.sort((a, b) => (countMap.get(b.target_id!) || 0) - (countMap.get(a.target_id!) || 0));
      reports = reports.slice(0, limit);
    }

    return NextResponse.json(reports);
  } catch (err) {
    logDebug(err);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
