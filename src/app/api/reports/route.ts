import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getApiSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account_id = Number(session.user.id);
    const { target_type, target_id, report_type_id, description } = await req.json();

    if (!target_type)
      return NextResponse.json({ error: "target_type is required" }, { status: 400 });

    if (target_id === undefined || target_id === null)
      return NextResponse.json({ error: "target_id is required" }, { status: 400 });

    let existingReport = null;

    if (Number(target_id) !== 0) {
      existingReport = await prisma.report.findFirst({
        where: {
          account_id,
          target_type,
          target_id: Number(target_id),
        },
      });

      if (existingReport) {
        return NextResponse.json(
          { error: "You have already reported this item." },
          { status: 400 }
        );
      }
    }

    const report = await prisma.report.create({
      data: {
        target_type,
        target_id: Number(target_id),
        report_type_id,
        description,
        account_id,
      },
      include: {
        reportType: true,
        account: true,
      },
    });

    let targetName = "";
    if (target_type === "POST") {
      const post = await prisma.jobPost.findUnique({
        where: { id: Number(target_id) },
        select: { jobName: true },
      });
      targetName = post?.jobName || "";
    } else if (target_type === "GENERAL") {
      targetName = "General Issue";
    }

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
    console.error(err);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetType = searchParams.get("targetType"); // optional
    const reportTypeId = searchParams.get("reportTypeId");
    const limit = Number(searchParams.get("limit") || 10);
    const sort = searchParams.get("sort");

    const where: any = {};
    if (targetType) where.target_type = targetType;
    if (reportTypeId && reportTypeId !== "all") where.report_type_id = Number(reportTypeId);

    const orderBy: any = {};
    if (sort === "created_at") orderBy.created_at = "desc";
    else if (sort === "resolved") orderBy.is_resolved = "desc";

    let reports = await prisma.report.findMany({
      where,
      include: { account: true, reportType: true },
      orderBy,
      take: limit,
    });

    const jobIds = reports
      .filter(r => r.target_type === "POST" && r.target_id !== null && r.target_id !== 0)
      .map(r => r.target_id as number);

    const jobsMap = new Map<number, any>();
    const applicationsMap = new Map<number, number>();
    if (jobIds.length > 0) {
      const jobs = await prisma.jobPost.findMany({
        where: { id: { in: jobIds } },
        include: {
          company: { select: {
              id: true,
                  name: true,
                  address: true,
                  account: {
                    select: {
                        logoUrl: true,
                        backgroundUrl: true,
          }
        }} },
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

    if (sort === "report_count" && targetType === "POST") {
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
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
