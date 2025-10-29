import { prisma } from "@/lib/db";

export async function postApproveCompany(
  companyId: number,
  action: "approve" | "reject",
  reason?: string
) {
  // Validate input
  if (!companyId || !["approve", "reject"].includes(action)) {
    throw new Error("Invalid request data");
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  try {
    // Update company registration status
    const updatedCompany = await prisma.company.update({
      where: {
        id: companyId
      },
      data: {
        registration_status: newStatus
      },
      include: {
        account: true
      },
    });

    // Notify the company
    await prisma.notification.create({
      data: {
        account_id: updatedCompany.account_id,
        message:
          action === "approve"
            ? "🎉 Your company registration has been approved! You can now post jobs and manage applications."
            : `❌ Your company registration has been rejected. ${
                reason ? `Reason: ${reason}` : ""
              }`,
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
