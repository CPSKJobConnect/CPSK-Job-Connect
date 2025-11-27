import { PATCH } from "@/app/api/account/password/route";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

jest.mock("@/lib/api-auth", () => ({
  getApiSession: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const { getApiSession } = require("@/lib/api-auth");

describe("PATCH /api/account/password", () => {
  const session = {
    user: { id: "42" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    getApiSession.mockResolvedValue(null);

    const request = new Request("http://localhost/api/account/password", {
      method: "PATCH",
      body: JSON.stringify({ newPassword: "S3cure!Library01" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request as any);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("requires new password", async () => {
    getApiSession.mockResolvedValue(session);

    const request = new Request("http://localhost/api/account/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword: "oldPass" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request as any);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("New password is required");
  });

  it("requires existing account", async () => {
    getApiSession.mockResolvedValue(session);
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new Request("http://localhost/api/account/password", {
      method: "PATCH",
      body: JSON.stringify({ newPassword: "S3cure!Library01" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Account not found");
  });

  it("requires current password if one exists", async () => {
    getApiSession.mockResolvedValue(session);
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({
      id: 42,
      password: "hash",
      email: "user@example.com",
    });

    const request = new Request("http://localhost/api/account/password", {
      method: "PATCH",
      body: JSON.stringify({ newPassword: "S3cure!Library01" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Current password is required");
  });

  it("rejects incorrect current password", async () => {
    getApiSession.mockResolvedValue(session);
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({
      id: 42,
      password: "hash",
      email: "user@example.com",
    });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

    const request = new Request("http://localhost/api/account/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword: "wrong", newPassword: "S3cure!Library01" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request as any);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Current password is incorrect");
  });

  it("rejects passwords identical to existing one", async () => {
    getApiSession.mockResolvedValue(session);
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({
      id: 42,
      password: "hash",
      email: "user@example.com",
    });
    (bcrypt.compare as jest.Mock)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);

    const request = new Request("http://localhost/api/account/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword: "Th!sIsCurreNt123", newPassword: "Th!sIsCurreNt123" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("New password must be different from the current password");
  });

  it("allows OAuth users to set a password without current password", async () => {
    getApiSession.mockResolvedValue(session);
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({
      id: 42,
      password: null,
      email: "user@example.com",
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue("new-hash");

    const request = new Request("http://localhost/api/account/password", {
      method: "PATCH",
      body: JSON.stringify({ newPassword: "S3cure!Library01" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: 42 },
      data: { password: "new-hash" },
    });
    expect(data.message).toBe("Password set successfully");
  });

  it("updates password when current password verified", async () => {
    getApiSession.mockResolvedValue(session);
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({
      id: 42,
      password: "hash",
      email: "user@example.com",
    });
    (bcrypt.compare as jest.Mock)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    (bcrypt.hash as jest.Mock).mockResolvedValue("new-hash");

    const request = new Request("http://localhost/api/account/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword: "OldPass!2345", newPassword: "S3cure!Library01" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Password updated successfully");
  });

  it("enforces password policy", async () => {
    getApiSession.mockResolvedValue(session);
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({
      id: 42,
      password: null,
      email: "user@example.com",
    });

    const request = new Request("http://localhost/api/account/password", {
      method: "PATCH",
      body: JSON.stringify({ newPassword: "weak" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/Use/);
  });
});
