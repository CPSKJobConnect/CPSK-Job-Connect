import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDashboardStats } from "./stats.logic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    // console.log("🔍 Session debug:", session);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role?.toLowerCase();
    // console.log("🔍 User role:", userRole);
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const stats = await getDashboardStats();
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard statistics" }, { status: 500 });
  }
}
