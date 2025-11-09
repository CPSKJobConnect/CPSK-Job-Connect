import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the Account first
    const account = await prisma.account.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Then get its company
    const company = await prisma.company.findUnique({
      where: { account_id: account.id },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        website: true,
        description: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: company.id.toString(),
      name: company.name,
      email: account.email,
      phone: company.phone,
      location: company.address,
      website: company.website,
      description: company.description,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();

    // Find the account first
    const account = await prisma.account.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!account)
      return NextResponse.json({ error: "Account not found" }, { status: 404 });

    // Update company using account_id
    const updated = await prisma.company.update({
      where: { account_id: account.id },
      data: {
        name: data.name,
        address: data.location, // map from frontend field
        website: data.website,
        phone: data.phone,
        description: data.description,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }
}

