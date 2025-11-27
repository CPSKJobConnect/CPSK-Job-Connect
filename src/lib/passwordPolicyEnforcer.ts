import { PasswordPolicyContext, PasswordPolicyError, getPasswordPolicyFailures } from "@/lib/passwordPolicy";

export function assertPasswordMeetsPolicy(password: string, context: PasswordPolicyContext = {}) {
  const failures = getPasswordPolicyFailures(password, context);

  if (failures.length > 0) {
    throw new PasswordPolicyError(failures[0]);
  }
}
