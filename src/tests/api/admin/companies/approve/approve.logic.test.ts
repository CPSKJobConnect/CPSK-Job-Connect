import { postApproveCompany } from "@/app/api/admin/companies/approve/approve.logic";
import { prisma } from "@/lib/db";

// Mock Prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    company: { update: jest.fn() },
    notification: { create: jest.fn() },
  },
}));

// Tests for postApproveCompany logic
describe("postApproveCompany", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Approves a company successfully", async () => {
    const mockCompany = {
      id: 1,
      registration_status: "approved",
      account_id: 100,
      account: { email: "company@example.com" },
    };

    (prisma.company.update as jest.Mock).mockResolvedValue(mockCompany);
    (prisma.notification.create as jest.Mock).mockResolvedValue({});

    const result = await postApproveCompany(1, "approve");

    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { registration_status: "approved" },
      include: { account: true },
    });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        account_id: 100,
        message:
          "🎉 Your company registration has been approved! You can now post jobs and manage applications.",
      },
    });

    expect(result).toEqual(mockCompany);
  });

  it("Rejects a company with reason", async () => {
    const mockCompany = {
      id: 2,
      registration_status: "rejected",
      account_id: 200,
      account: { email: "another@example.com" },
    };

    (prisma.company.update as jest.Mock).mockResolvedValue(mockCompany);
    (prisma.notification.create as jest.Mock).mockResolvedValue({});

    const result = await postApproveCompany(2, "reject", "Not meeting requirements");

    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { registration_status: "rejected" },
      include: { account: true },
    });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        account_id: 200,
        message: "❌ Your company registration has been rejected. Reason: Not meeting requirements",
      },
    });

    expect(result).toEqual(mockCompany);
  });

  it("Throws error for invalid request data", async () => {
    await expect(postApproveCompany(0 as any, "approve")).rejects.toThrow(
      "Invalid request data"
    );
    await expect(postApproveCompany(1, "invalid_action" as any)).rejects.toThrow(
      "Invalid request data"
    );
  });

  it("Throws error for non-existent company", async () => {
    (prisma.company.update as jest.Mock).mockRejectedValue({ code: "P2025" });

    await expect(postApproveCompany(999, "approve")).rejects.toThrow(
      "Company not found"
    );
  });
});