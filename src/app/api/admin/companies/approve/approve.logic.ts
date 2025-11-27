import { prisma } from "@/lib/db";
import DOMPurify from "isomorphic-dompurify";

export async function postApproveCompany(
  companyId: number,
  action: "approve" | "reject",
  reason?: string
) {
  // -----------------------------
  // ✅ ASVS 1.1.1 + 1.3.1: Sanitize & canonicalize inputs
  // -----------------------------
  const safeCompanyId = Number(companyId);

  const safeAction = DOMPurify.sanitize(action).trim();
  const safeReason = reason ? DOMPurify.sanitize(reason).trim() : undefined;

  if (!safeCompanyId || !["approve", "reject"].includes(safeAction)) {
    throw new Error("Invalid request data");
  }

  const newStatus = safeAction === "approve" ? "approved" : "rejected";

  try {
    // Update company registration status
    const updatedCompany = await prisma.company.update({
      where: {
        id: safeCompanyId,
      },
      data: {
        registration_status: newStatus,
      },
      include: {
        account: true,
      },
    });

    // -----------------------------
    // ✅ sanitize-safe notification message
    // -----------------------------
    const message =
      safeAction === "approve"
        ? "🎉 Your company registration has been approved! You can now post jobs and manage applications."
        : `❌ Your company registration has been rejected.${
            safeReason ? ` Reason: ${safeReason}` : ""
          }`;

    // Create notification
    await prisma.notification.create({
      data: {
        account_id: updatedCompany.account_id,
        message,
      },
    });

    return updatedCompany;
  } catch (error: any) {
    if (error.code === "P2025") {
      throw new Error("Company not found");
    }
    throw error;
  }
}
