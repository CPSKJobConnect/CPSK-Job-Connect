import * as notifyModule from "@/lib/notifyAdmins";
import { prisma } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  prisma: {
    accountRole: {
      findFirst: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
    },
    notification: {
      createMany: jest.fn(),
    },
  },
}));

describe("notifyAdmins", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 0 when admin role missing", async () => {
    (prisma.accountRole.findFirst as jest.Mock).mockResolvedValue(null);

    const count = await notifyModule.notifyAdmins("Test");
    expect(count).toBe(0);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Admin role not found")
    );
  });

  it("returns 0 when no admins exist", async () => {
    (prisma.accountRole.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.account.findMany as jest.Mock).mockResolvedValue([]);

    const count = await notifyModule.notifyAdmins("Test");
    expect(count).toBe(0);
    expect(console.warn).toHaveBeenCalled();
  });

  it("creates notifications for admins and returns count", async () => {
    (prisma.accountRole.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.account.findMany as jest.Mock).mockResolvedValue([
      { id: 1, email: "a@example.com" },
      { id: 2, email: "b@example.com" },
    ]);
    (prisma.notification.createMany as jest.Mock).mockResolvedValue({
      count: 2,
    });

    const count = await notifyModule.notifyAdmins("Hello admins", 99);
    expect(count).toBe(2);
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        { account_id: 1, sender_id: 99, message: "Hello admins", is_read: false },
        { account_id: 2, sender_id: 99, message: "Hello admins", is_read: false },
      ],
    });
  });

  it("fails gracefully when prisma throws", async () => {
    (prisma.accountRole.findFirst as jest.Mock).mockRejectedValue(
      new Error("DB down")
    );

    const count = await notifyModule.notifyAdmins("Test");
    expect(count).toBe(0);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Error notifying admins"),
      expect.any(Error)
    );
  });

  it("helper functions send descriptive messages", async () => {
    (prisma.accountRole.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.account.findMany as jest.Mock).mockResolvedValue([
      { id: 1, email: "admin@example.com" },
    ]);
    (prisma.notification.createMany as jest.Mock).mockResolvedValue({
      count: 1,
    });

    await notifyModule.notifyAdminsNewAlumni("Alice", "S123", 5);
    expect(prisma.notification.createMany).toHaveBeenLastCalledWith({
      data: [
        expect.objectContaining({
          message: expect.stringContaining("Alice"),
          sender_id: 5,
        }),
      ],
    });

    await notifyModule.notifyAdminsAlumniReapplication("Bob", "S456", 6);
    expect(prisma.notification.createMany).toHaveBeenLastCalledWith({
      data: [
        expect.objectContaining({
          message: expect.stringContaining("Bob"),
          sender_id: 6,
        }),
      ],
    });

    await notifyModule.notifyAdminsNewCompany("Acme Inc", 7);
    expect(prisma.notification.createMany).toHaveBeenLastCalledWith({
      data: [
        expect.objectContaining({
          message: expect.stringContaining("Acme Inc"),
          sender_id: 7,
        }),
      ],
    });

    await notifyModule.notifyAdminsCompanyReapplication("Globex", 8);
    expect(prisma.notification.createMany).toHaveBeenLastCalledWith({
      data: [
        expect.objectContaining({
          message: expect.stringContaining("Globex"),
          sender_id: 8,
        }),
      ],
    });
  });
});
