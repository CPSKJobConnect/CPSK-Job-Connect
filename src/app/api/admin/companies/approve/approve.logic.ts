import { prisma } from "@/lib/db";

export async function postApproveCompany(
  companyId: number,
  action: "approved" | "rejected",
  reason?: string
) {
  // Validate request data
  if (!companyId || !action || !["approved", "rejected"].includes(action)) {
    throw new Error("Invalid request data");
  }

  let updatedCompany;
  try {
    // Update company registration status
    updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        registration_status: action === "approved" ? "approved" : "rejected"
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
        action === "approved"
          ? "Your company registration has been approved! You can now post jobs and manage applications."
          : `Your company registration has been rejected. ${
              reason ? `Reason: ${reason}` : ""
            }`
    }
  });

  return updatedCompany;
}
