import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the account
    const account = await prisma.account.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        logoUrl: true,
        backgroundUrl: true,
        accountRole: {
          select: { name: true }
        }
      }
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Get company details
    const company = await prisma.company.findUnique({
      where: { account_id: account.id },
      include: {
        account: {
          include: {
            documents: {
              where: {
                doc_type_id: 7 // Company Evidence documents
              },
              include: {
                documentType: true
              },
              orderBy: {
                created_at: 'desc'
              }
            }
          }
        }
      }
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Format response to match Company interface
    const response = {
      id: company.id,
      account_id: company.account_id,
      profile_url: account.logoUrl || "",
      bg_profile_url: account.backgroundUrl || "",
      email: account.email,
      role: account.accountRole?.name?.toLowerCase() || "company",
      name: company.name,
      address: [company.address], // Convert to array for compatibility
      description: company.description,
      department: [], // Companies don't have departments in schema, empty array for compatibility
      year: new Date().getFullYear(), // Not used for companies but required by interface
      phone: company.phone,
      registration_status: company.registration_status as "PENDING" | "APPROVED" | "REJECTED",
      documents: {
        evidence: company.account.documents.map(doc => ({
          id: doc.id,
          name: doc.file_name,
          url: doc.file_path,
          uploadedAt: doc.created_at.toISOString(),
          type: doc.documentType.name
        }))
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return NextResponse.json({ error: "Failed to fetch company profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    // Get the account
    const account = await prisma.account.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    });

    if (!account?.company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Extract form data
    const name = formData.get("name") as string | null;
    const address = formData.get("address") as string | null;
    const phone = formData.get("phone") as string | null;
    const description = formData.get("description") as string | null;
    const website = formData.get("website") as string | null;
    const logoFile = formData.get("logo") as File | null;
    const backgroundFile = formData.get("background") as File | null;

    // Validate required fields
    if (name && name.trim().length < 3) {
      return NextResponse.json({ error: "Company name must be at least 3 characters" }, { status: 400 });
    }
    if (phone && !/^\d{10,}$/.test(phone)) {
      return NextResponse.json({ error: "Phone number must be at least 10 digits" }, { status: 400 });
    }
    if (description && description.trim().length < 10) {
      return NextResponse.json({ error: "Description must be at least 10 characters" }, { status: 400 });
    }

    // Handle image uploads
    let logoUrl = account.logoUrl;
    let backgroundUrl = account.backgroundUrl;

    if (logoFile && logoFile.size > 0) {
      try {
        const { uploadImage } = await import("@/lib/uploadImage");
        logoUrl = await uploadImage(logoFile, String(account.id), "logo");
      } catch (error) {
        console.error("Error uploading logo:", error);
        return NextResponse.json({ error: "Failed to upload logo image" }, { status: 500 });
      }
    }

    if (backgroundFile && backgroundFile.size > 0) {
      try {
        const { uploadImage } = await import("@/lib/uploadImage");
        backgroundUrl = await uploadImage(backgroundFile, String(account.id), "background");
      } catch (error) {
        console.error("Error uploading background:", error);
        return NextResponse.json({ error: "Failed to upload background image" }, { status: 500 });
      }
    }

    // Update account images if changed
    if (logoUrl !== account.logoUrl || backgroundUrl !== account.backgroundUrl) {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          logoUrl,
          backgroundUrl
        }
      });
    }

    // Update company information
    const updatedCompany = await prisma.company.update({
      where: { id: account.company.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(address && { address: address.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(description && { description: description.trim() }),
        ...(website !== null && { website: website.trim() || null }),
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      company: updatedCompany
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating company profile:", error);
    return NextResponse.json({ error: "Failed to update company profile" }, { status: 500 });
  }
}
