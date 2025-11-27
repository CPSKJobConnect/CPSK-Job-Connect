import {
  PASSWORD_DENYLIST_LABEL,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS,
  PasswordPolicyError,
  evaluatePasswordPolicy,
  getPasswordPolicyFailures,
} from "@/lib/passwordPolicy";
import { assertPasswordMeetsPolicy } from "@/lib/passwordPolicyEnforcer";

describe("passwordPolicy", () => {
  it("evaluates password and reports failures", () => {
    const result = evaluatePasswordPolicy("short");
    const failures = result.filter((item) => !item.passed);

    expect(failures.length).toBeGreaterThan(0);
    expect(failures.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        `Use ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`,
        "Include at least one uppercase letter",
      ])
    );
  });

  it("returns no failures for strong password", () => {
    const failures = getPasswordPolicyFailures("S3cure!Passw0rd");
    expect(failures).toHaveLength(0);
  });

  it("throws PasswordPolicyError when requirements are not met", () => {
    expect(() => assertPasswordMeetsPolicy("weakpass")).toThrow(PasswordPolicyError);
  });

  it("rejects passwords contained in the denylist", () => {
    expect(() => assertPasswordMeetsPolicy("N0=Acc3ss")).toThrow(PasswordPolicyError);
    expect(() => assertPasswordMeetsPolicy("N0=Acc3ss")).toThrow(PASSWORD_DENYLIST_LABEL);
  });

  it("considers email fragments when validating", () => {
    const failures = getPasswordPolicyFailures("StudentEmail123!", { email: "student@ku.th" });
    expect(failures).toEqual(expect.arrayContaining(["Do not reuse parts of your email/username"]));
  });
});
