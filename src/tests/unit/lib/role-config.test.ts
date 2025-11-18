import {
  ROLE_CONFIGS,
  LOGIN_FIELDS,
  STUDENT_REGISTER_FIELDS,
  COMPANY_REGISTER_FIELDS,
  getFieldsForRole,
} from "@/lib/role-config";

describe("role config", () => {
  it("exposes configs for each role", () => {
    expect(Object.keys(ROLE_CONFIGS)).toEqual(
      expect.arrayContaining(["student", "company", "admin"])
    );
    expect(ROLE_CONFIGS.student.redirectPath).toBe("/student/dashboard");
  });

  it("returns login fields regardless of role", () => {
    const result = getFieldsForRole("company", "login");
    expect(result).toBe(LOGIN_FIELDS);
  });

  it("returns role-specific register fields", () => {
    expect(getFieldsForRole("student", "register")).toBe(
      STUDENT_REGISTER_FIELDS
    );
    expect(getFieldsForRole("company", "register")).toBe(
      COMPANY_REGISTER_FIELDS
    );
    expect(getFieldsForRole("admin", "register")).toEqual([]);
  });
});
