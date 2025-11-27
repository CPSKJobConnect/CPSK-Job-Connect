/**
 * Tests for authOptions credential provider and callbacks
 */

process.env.GOOGLE_CLIENT_ID = "test-google-id";
process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";

let capturedAuthorize: any;

jest.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  default: (options: any) => {
    capturedAuthorize = options.authorize;
    return { id: "credentials", authorize: options.authorize };
  },
}));

jest.mock("next-auth/providers/google", () => ({
  __esModule: true,
  default: () => ({ id: "google" }),
}));

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

jest.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    accountRole: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
}));

const authorize = (credentials: any) => capturedAuthorize(credentials);

const baseAccount = {
  id: 42,
  email: "student@ku.th",
  username: "Student",
  password: "$2a$10$hash",
  role: 1,
  logoUrl: "logo.png",
  backgroundUrl: "bg.png",
  is_active: true,
  accountRole: { name: "student" },
  student: {
    email_verified: true,
    student_status: "CURRENT",
    verification_status: "APPROVED",
  },
  company: {
    registration_status: "APPROVED",
  },
};

describe("authOptions.credentials.authorize", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws when required credentials are missing", async () => {
    await expect(authorize({ email: "student@ku.th" } as any)).rejects.toThrow(
      "Invalid credentials"
    );
  });

  it("throws when user does not exist", async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      authorize({ email: "student@ku.th", password: "secret" })
    ).rejects.toThrow(/INVALID_CREDENTIALS/);
  });

  it("throws when account is disabled", async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({
      ...baseAccount,
      is_active: false,
    });

    await expect(
      authorize({ email: "student@ku.th", password: "secret" })
    ).rejects.toThrow("ACCOUNT_DISABLED");
  });

  it("throws when password is missing (OAuth account)", async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({
      ...baseAccount,
      password: null,
    });

    await expect(
      authorize({ email: "student@ku.th", password: "secret" })
    ).rejects.toThrow("OAUTH_ACCOUNT");
  });

  it("throws when password does not match", async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(baseAccount);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      authorize({ email: "student@ku.th", password: "wrong" })
    ).rejects.toThrow(/INVALID_CREDENTIALS/);
  });

  it("throws when role does not match", async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({
      ...baseAccount,
      accountRole: { name: "company" },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(
      authorize({ email: "student@ku.th", password: "secret", role: "student" })
    ).rejects.toThrow("ROLE_MISMATCH");
  });

  it("returns sanitized user when credentials are valid", async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(baseAccount);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await authorize({
      email: "student@ku.th",
      password: "secret",
      role: "student",
    });

    expect(result).toMatchObject({
      id: baseAccount.id.toString(),
      email: baseAccount.email,
      role: "student",
      name: baseAccount.username,
      logoUrl: baseAccount.logoUrl,
      emailVerified: true,
      companyRegistrationStatus: "APPROVED",
    });
  });
});

describe("authOptions callbacks", () => {
  const callbacks = authOptions.callbacks!;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("jwt callback maps user properties onto the token", async () => {
    const token = await callbacks.jwt!({
      token: { sub: "42" } as any,
      user: {
        role: "student",
        name: "Student",
        logoUrl: "logo.png",
        backgroundUrl: "bg.png",
        isActive: true,
        emailVerified: true,
        studentStatus: "CURRENT",
      } as any,
      account: null,
      trigger: undefined,
      session: undefined,
    });

    expect(token.role).toBe("student");
    expect(token.username).toBe("Student");
    expect(token.logoUrl).toBe("logo.png");
    expect(token.studentStatus).toBe("CURRENT");
  });

  it("jwt callback fetches user data for Google accounts", async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(baseAccount);

    const token = await callbacks.jwt!({
      token: { sub: "google-123" } as any,
      user: { email: baseAccount.email } as any,
      account: { provider: "google" } as any,
      trigger: undefined,
      session: undefined,
    });

    expect(prisma.account.findUnique).toHaveBeenCalledWith({
      where: { email: baseAccount.email },
      select: expect.any(Object),
    });
    expect(token.role).toBe("student");
    expect(token.sub).toBe(baseAccount.id.toString());
  });

  it("session callback copies token fields to the session user", async () => {
    const sessionResult = await callbacks.session!({
      session: { user: {} } as any,
      token: {
        sub: "42",
        role: "student",
        username: "Student",
        logoUrl: "logo.png",
        backgroundUrl: "bg.png",
        isActive: true,
        emailVerified: true,
        studentStatus: "CURRENT",
        verificationStatus: "APPROVED",
        companyRegistrationStatus: "APPROVED",
      } as any,
    });

    expect(sessionResult.user.id).toBe("42");
    expect(sessionResult.user.role).toBe("student");
    expect(sessionResult.user.logoUrl).toBe("logo.png");
    expect(sessionResult.user.verificationStatus).toBe("APPROVED");
  });
});
