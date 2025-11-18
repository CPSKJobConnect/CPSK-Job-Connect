/**
 * Unit tests for KU email validation utilities
 */

import {
  generateVerificationCode,
  getKUDomain,
  getVerificationExpiry,
  isValidKUEmail,
  isVerificationExpired,
} from "@/lib/email-validation";

describe("email-validation utilities", () => {
  describe("isValidKUEmail", () => {
    it("accepts KU domains regardless of case or whitespace", () => {
      expect(isValidKUEmail("Student@KU.th ")).toBe(true);
    });

    it("rejects non KU domains and empty strings", () => {
      expect(isValidKUEmail("user@example.com")).toBe(false);
      expect(isValidKUEmail("")).toBe(false);
    });
  });

  describe("getKUDomain", () => {
    it("returns the KU domain when present", () => {
      expect(getKUDomain("john@ku.th")).toBe("@ku.th");
    });

    it("returns null for invalid domains or inputs", () => {
      expect(getKUDomain("john@example.com")).toBeNull();
      expect(getKUDomain("")).toBeNull();
    });
  });

  describe("generateVerificationCode", () => {
    it("generates six digit numeric codes", () => {
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5);

      const code = generateVerificationCode();
      expect(code).toHaveLength(6);
      expect(code).toBe("550000");

      randomSpy.mockRestore();
    });
  });

  describe("getVerificationExpiry", () => {
    const now = new Date("2025-03-01T00:00:00.000Z");

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(now);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("returns a date 15 minutes from now", () => {
      const expiry = getVerificationExpiry();
      expect(expiry.toISOString()).toBe(
        new Date(now.getTime() + 15 * 60 * 1000).toISOString()
      );
    });

    it("detects expired verification codes", () => {
      const expiry = new Date(now.getTime() - 1);
      expect(isVerificationExpired(expiry)).toBe(true);
    });
  });
});
