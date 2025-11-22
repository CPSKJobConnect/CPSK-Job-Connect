import { isPasswordInDenylist } from "@/lib/passwordDenylist";

export interface PasswordPolicyContext {
  email?: string;
  name?: string;
  username?: string;
}

export class PasswordPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasswordPolicyError";
  }
}

type PasswordPolicyCheck = {
  id: string;
  label: string;
  test: (password: string, context: PasswordPolicyContext) => boolean;
};

const COMMON_PATTERNS = [/password/i, /1234/, /qwerty/i, /letmein/i, /welcome/i];
const SEQUENTIAL_PATTERN = /(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|defg|abcd)/i;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_DENYLIST_LABEL =
  "Password must not be one of the top 3,000 most common passwords from known breach lists.";

export const PASSWORD_POLICY_CHECKS: PasswordPolicyCheck[] = [
  {
    id: "length",
    label: `Use ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
  },
  {
    id: "upper",
    label: "Include at least one uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "lower",
    label: "Include at least one lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "Include at least one number",
    test: (password) => /\d/.test(password),
  },
  {
    id: "symbol",
    label: "Include at least one special character (!@#$%^&*)",
    test: (password) => /[^a-zA-Z0-9]/.test(password),
  },
  {
    id: "common",
    label: "Avoid obvious dictionary words or sequential patterns",
    test: (password) =>
      !COMMON_PATTERNS.some((pattern) => pattern.test(password)) && !SEQUENTIAL_PATTERN.test(password),
  },
  {
    id: "denylist",
    label: PASSWORD_DENYLIST_LABEL,
    test: (password) => password.length < PASSWORD_MIN_LENGTH || !isPasswordInDenylist(password),
  },
  {
    id: "email",
    label: "Do not reuse parts of your email/username",
    test: (password, context) => {
      const emailLocal = context.email?.split("@")[0]?.toLowerCase() ?? "";
      const username = context.username?.toLowerCase() ?? "";
      const name = context.name?.toLowerCase() ?? "";
      const lowerPassword = password.toLowerCase();

      const containsEmail = emailLocal.length >= 4 && lowerPassword.includes(emailLocal);
      const containsUsername = username.length >= 4 && lowerPassword.includes(username);
      const containsName = name.length >= 3 && lowerPassword.includes(name.replace(/\s+/g, ""));

      return !(containsEmail || containsUsername || containsName);
    },
  },
];

export const PASSWORD_REQUIREMENTS = PASSWORD_POLICY_CHECKS.map((check) => check.label);

export function evaluatePasswordPolicy(password: string, context: PasswordPolicyContext = {}) {
  return PASSWORD_POLICY_CHECKS.map((check) => ({
    id: check.id,
    label: check.label,
    passed: check.test(password, context),
  }));
}

export function getPasswordPolicyFailures(password: string, context: PasswordPolicyContext = {}) {
  return evaluatePasswordPolicy(password, context)
    .filter((item) => !item.passed)
    .map((item) => item.label);
}
