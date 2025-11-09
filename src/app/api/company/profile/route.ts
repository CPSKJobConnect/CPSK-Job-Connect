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



// Mock data for the company profile page
// import { NextResponse } from "next/server";

// export async function GET() {
//   // mock data for the company profile page
//   const mockCompanyProfile = {
//     id: "mock-company-001",
//     name: "Wongnai Technologies Co., Ltd.",
//     email: "contact@wongnai.com",
//     website: "https://www.wongnai.com",
//     location: "Bangkok, Thailand",
//     phone: "0999999999",
//     description:
//       "We are a leading Thai tech company building food delivery, review, and digital service platforms.",
//     industry: "Technology / Food Delivery",
//     established: "2010",
//     jobsPosted: 12,
//     isVerified: true,
//   };

//   return NextResponse.json(mockCompanyProfile, { status: 200 });
// }
