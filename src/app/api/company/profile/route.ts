import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import DOMPurify from "isomorphic-dompurify";

function sanitizeInput(input: string | null): string | null {
  return input ? DOMPurify.sanitize(input.trim()) : null;
}

const logDebug = (...args: any[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(...args)
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.account.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        logoUrl: true,
        backgroundUrl: true,
        accountRole: { select: { name: true } }
      }
    });

    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const company = await prisma.company.findUnique({
      where: { account_id: account.id },
      include: {
        account: {
          include: {
            documents: {
              where: { doc_type_id: 7 },
              include: { documentType: true },
              orderBy: { created_at: 'desc' }
            }
          }
        }
      }
    });

    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const response = {
      id: company.id,
      account_id: company.account_id,
      profile_url: sanitizeInput(account.logoUrl),
      bg_profile_url: sanitizeInput(account.backgroundUrl),
      email: sanitizeInput(account.email),
      role: sanitizeInput(account.accountRole?.name?.toLowerCase() ?? null) || "company",
      name: sanitizeInput(company.name),
      address: [sanitizeInput(company.address) || ""],
      description: sanitizeInput(company.description),
      department: [],
      year: new Date().getFullYear(),
      phone: sanitizeInput(company.phone),
      registration_status: company.registration_status as "PENDING" | "APPROVED" | "REJECTED",
      verification_notes: sanitizeInput(company.verification_notes),
      documents: {
        evidence: company.account.documents.map(doc => ({
          id: doc.id,
          name: sanitizeInput(doc.file_name) || "",
          url: sanitizeInput(doc.file_path) || "",
          uploadedAt: doc.created_at.toISOString(),
          type: sanitizeInput(doc.documentType.name) || ""
        }))
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    logDebug("Error fetching company profile:", error);
    return NextResponse.json({ error: "Failed to fetch company profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const account = await prisma.account.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    });

    if (!account?.company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    // Decode & sanitize input
    const name = sanitizeInput(formData.get("name") ? decodeURIComponent(String(formData.get("name"))) : null);
    const address = sanitizeInput(formData.get("address") ? decodeURIComponent(String(formData.get("address"))) : null);
    const phone = sanitizeInput(formData.get("phone") ? decodeURIComponent(String(formData.get("phone"))) : null);
    const description = sanitizeInput(formData.get("description") ? decodeURIComponent(String(formData.get("description"))) : null);
    const website = sanitizeInput(formData.get("website") ? decodeURIComponent(String(formData.get("website"))) : null);
    const logoFile = formData.get("logo") as File | null;
    const backgroundFile = formData.get("background") as File | null;

    if (name && name.length < 3) return NextResponse.json({ error: "Company name must be at least 3 characters" }, { status: 400 });
    if (phone && !/^\d{10,}$/.test(phone)) return NextResponse.json({ error: "Phone number must be at least 10 digits" }, { status: 400 });
    if (description && description.length < 10) return NextResponse.json({ error: "Description must be at least 10 characters" }, { status: 400 });

    // Handle images (unchanged)
    let logoUrl = account.logoUrl;
    let backgroundUrl = account.backgroundUrl;
    if (logoFile?.size) logoUrl = await (await import("@/lib/uploadImage")).uploadImage(logoFile, String(account.id), "logo");
    if (backgroundFile?.size) backgroundUrl = await (await import("@/lib/uploadImage")).uploadImage(backgroundFile, String(account.id), "background");

    if (logoUrl !== account.logoUrl || backgroundUrl !== account.backgroundUrl) {
      await prisma.account.update({ where: { id: account.id }, data: { logoUrl, backgroundUrl } });
    }

    const updatedCompany = await prisma.company.update({
      where: { id: account.company.id },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(phone && { phone }),
        ...(description && { description }),
        ...(website !== null && { website: website || null }),
        updated_at: new Date()
      }
    });

    return NextResponse.json({ message: "Profile updated successfully", company: updatedCompany, logoUrl, backgroundUrl }, { status: 200 });

  } catch (error) {
    logDebug("Error updating company profile:", error);
    return NextResponse.json({ error: "Failed to update company profile" }, { status: 500 });
  }
}
