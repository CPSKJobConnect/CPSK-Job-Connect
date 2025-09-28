import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const jobs = await prisma.job_Post.findMany();
  return NextResponse.json(jobs);
}