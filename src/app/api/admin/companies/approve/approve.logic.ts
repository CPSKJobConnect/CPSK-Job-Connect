import { prisma } from "@/lib/db";

export async function postApproveCompany(
  companyId: number,
  action: "approve" | "reject",
  reason?: string
) {
  // Validate request data
  if (!companyId || !action || !["approve", "reject"].includes(action)) {
    throw new Error("Invalid request data");
  }

  let updatedCompany;
  try {
    // Update company registration status
    updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        registration_status: action === "approve" ? "approve" : "reject"
      },
      include: {
        account: true
      }
    });
  } catch (error: any) {
    // Handle case where company doesn't exist
    if (error.code === "P2025") {
      throw new Error("Company not found");
    }
    throw error;
  }

  // Create notification for the company
  await prisma.notification.create({
    data: {
      account_id: updatedCompany.account_id,
      message:
        action === "approve"
          ? "Your company registration has been approved! You can now post jobs and manage applications."
          : `Your company registration has been reject. ${
              reason ? `Reason: ${reason}` : ""
            }`
    }
  });

  return updatedCompany;
}
