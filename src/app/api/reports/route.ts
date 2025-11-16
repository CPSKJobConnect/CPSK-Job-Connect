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

    if (!target_type) return NextResponse.json({ error: "target_type is required" }, { status: 400 });
    if (!target_id) return NextResponse.json({ error: "target_id is required" }, { status: 400 });

    const existingReport = await prisma.report.findFirst({
      where: {
        account_id,
        target_type,
        target_id,
      },
    });

    if (existingReport) {
      return NextResponse.json({ error: "You have already reported this item." }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        target_type,
        target_id,
        report_type_id: report_type_id || null,
        description: description || null,
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
        where: { id: target_id },
        select: { jobName: true },
      });
      targetName = post?.jobName || "";
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
