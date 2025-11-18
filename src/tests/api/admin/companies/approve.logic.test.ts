/**
 * Tests for Admin Company Approval Logic
 *
 * Function: postApproveCompany
 * Ensures company approval/rejection updates Prisma and sends notifications.
 */

import { postApproveCompany } from "@/app/api/admin/companies/approve/approve.logic";
import { prisma } from "@/lib/db";
import { resetAllMocks } from "@/tests/setup/mocks";

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock("@/lib/db", () => ({
  prisma: {
    company: {
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

// ============================================================================
// TEST DATA
// ============================================================================

const baseCompany = {
  id: 1,
  account_id: 10,
  registration_status: "pending",
  account: {
    id: 10,
    email: "company@example.com",
  },
};

// ============================================================================
// TESTS
// ============================================================================

describe("postApproveCompany", () => {
  beforeEach(() => {
    resetAllMocks();
    (prisma.company.update as jest.Mock).mockResolvedValue(baseCompany);
    (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 1 });
  });

  it("approves a company and sends notification", async () => {
    await postApproveCompany(1, "approve");

    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { registration_status: "approved" },
      include: { account: true },
    });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        account_id: baseCompany.account_id,
        message: expect.stringContaining("approved"),
      },
    });
  });

  it("rejects a company and includes reason in notification", async () => {
    await postApproveCompany(1, "reject", "Incomplete documents");

    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { registration_status: "rejected" },
      include: { account: true },
    });

    const notificationMessage =
      (prisma.notification.create as jest.Mock).mock.calls[0][0].data.message;

    expect(notificationMessage).toContain("rejected");
    expect(notificationMessage).toContain("Reason: Incomplete documents");
  });

  it("throws when request data is invalid", async () => {
    await expect(postApproveCompany(0 as any, "approve")).rejects.toThrow(
      "Invalid request data"
    );

    await expect(
      postApproveCompany(1, "invalid-action" as any)
    ).rejects.toThrow("Invalid request data");
  });

  it("throws a not found error when Prisma returns P2025", async () => {
    (prisma.company.update as jest.Mock).mockRejectedValue({ code: "P2025" });

    await expect(postApproveCompany(999, "approve")).rejects.toThrow(
      "Company not found"
    );
  });

  it("rethrows unexpected errors", async () => {
    (prisma.company.update as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    await expect(postApproveCompany(1, "approve")).rejects.toThrow(
      "Database error"
    );
  });
});
